"""
Delivery Orchestrator — Nouvia Intelligence Platform
Routes change_requests to the correct destination: defects, governance queue, or delivery tasks.
Triggered every 5 minutes by Cloud Scheduler.
"""
import logging
from datetime import datetime, timezone

from fastapi import FastAPI
from google.cloud import firestore

# ── Setup ─────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ID = "nouvia-os"
db = firestore.Client(project=PROJECT_ID)

app = FastAPI(title="Nouvia Delivery Orchestrator", version="1.0.0")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Routing logic ─────────────────────────────────────────────────────────────

def route_to_defect(req_id: str, req: dict) -> str:
    """Create a defect from a bug_fix change_request."""
    defect = {
        "client_id": req.get("client_id"),
        "engagement_id": req.get("engagement_id", ""),
        "severity": "medium" if req.get("priority") == "high" else "low",
        "status": "detected",
        "description": req.get("description", req.get("title", "")),
        "detected_at": now_iso(),
        "detected_by": "orchestrator",
        "source_request_id": req_id,
        "created_by": "orchestrator",
    }
    ref = db.collection("defects").add(defect)
    db.collection("change_requests").document(req_id).update({
        "status": "routed_to_defects",
        "routed_to": f"defects/{ref[1].id}",
        "updated_at": now_iso(),
    })
    logger.info(f"[orchestrator] {req_id} → defects/{ref[1].id}")
    return ref[1].id


def route_to_governance(req_id: str, req: dict) -> str:
    """Flag a question for Ben's response queue."""
    db.collection("change_requests").document(req_id).update({
        "status": "pending_response",
        "updated_at": now_iso(),
    })
    logger.info(f"[orchestrator] {req_id} → governance (question)")
    return req_id


def find_active_engagement(client_id: str):
    """Find the most recent non-operating engagement for a client."""
    active_statuses = ["intake", "scoping", "building", "testing", "deployed"]
    snap = (
        db.collection("engagements")
        .where("client_id", "==", client_id)
        .where("status", "in", active_statuses)
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(1)
        .get()
    )
    docs = list(snap)
    if docs:
        return docs[0].id, docs[0].to_dict()
    return None, None


def route_to_delivery(req_id: str, req: dict) -> dict:
    """Create a delivery_task or new engagement, route the change_request."""
    client_id = req.get("client_id", "unknown")
    eng_id, eng = find_active_engagement(client_id)
    result = {}

    if eng_id:
        # Add as a task on the existing engagement
        task = {
            "engagement_id": eng_id,
            "client_id": client_id,
            "title": req.get("title", "Untitled task"),
            "description": req.get("description", ""),
            "priority": req.get("priority", "medium"),
            "complexity": req.get("complexity", "M"),
            "category": req.get("category", "change_request"),
            "status": "backlog",
            "source_request_id": req_id,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "created_by": "orchestrator",
        }
        ref = db.collection("delivery_tasks").add(task)
        result = {"routed_to": "delivery_task", "task_id": ref[1].id, "engagement_id": eng_id}
        db.collection("change_requests").document(req_id).update({
            "status": "routed_to_delivery",
            "routed_to": f"delivery_tasks/{ref[1].id}",
            "engagement_id": eng_id,
            "updated_at": now_iso(),
        })
        logger.info(f"[orchestrator] {req_id} → delivery_tasks/{ref[1].id} (eng: {eng_id})")

    else:
        # No active engagement — create new one at intake
        new_eng = {
            "client_id": client_id,
            "title": f"{client_id} — {req.get('title', 'New Engagement')}",
            "type": "new_build",
            "scope_summary": req.get("description", ""),
            "status": "intake",
            "estimated_value_usd": "",
            "source_request_id": req_id,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "created_by": "orchestrator",
        }
        eng_ref = db.collection("engagements").add(new_eng)
        new_eng_id = eng_ref[1].id
        result = {"routed_to": "new_engagement", "engagement_id": new_eng_id}
        db.collection("change_requests").document(req_id).update({
            "status": "routed_to_delivery",
            "routed_to": f"engagements/{new_eng_id}",
            "engagement_id": new_eng_id,
            "updated_at": now_iso(),
        })
        logger.info(f"[orchestrator] {req_id} → new engagement/{new_eng_id}")

    return result


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/orchestrate/health")
def health():
    return {"status": "healthy", "version": "1.0"}


def sla_hours_for_priority(priority: str) -> int:
    return {"urgent": 2, "high": 8, "normal": 24, "low": 72}.get(priority, 24)


def bridge_aims_requests():
    """Convert submitted aims_requests into change_requests for the standard pipeline."""
    aims_snap = (
        db.collection("aims_requests")
        .where("status", "==", "submitted")
        .order_by("created_at")
        .limit(50)
        .get()
    )
    bridged = 0
    for doc in aims_snap:
        aims_id = doc.id
        aims = doc.to_dict()
        ack_time = now_iso()
        # Map AIMS category → change_request category
        cat_map = {
            "feature_request": "new_feature",
            "enhancement":     "enhancement",
            "bug_report":      "bug_fix",
            "support_request": "change_request",
            "question":        "question",
        }
        cr_category = cat_map.get(aims.get("category", "support_request"), "change_request")

        # Create change_request
        cr = {
            "client_id":       aims.get("client_id", ""),
            "title":           aims.get("title", ""),
            "description":     aims.get("description", ""),
            "category":        cr_category,
            "priority":        aims.get("priority", "normal"),
            "status":          "submitted",
            "source":          "aims_portal",
            "source_detail":   f"AIMS submission by {aims.get('submitted_by', 'unknown')}",
            "extracted_by":    "aims_bridge",
            "aims_request_id": aims_id,
            "created_at":      aims.get("created_at", ack_time),
            "updated_at":      ack_time,
        }
        db.collection("change_requests").add(cr)

        # Calculate SLA met
        sla_hours = sla_hours_for_priority(aims.get("priority", "normal"))
        try:
            created = datetime.fromisoformat(aims.get("created_at", ack_time).replace("Z", "+00:00"))
            ack_dt  = datetime.fromisoformat(ack_time.replace("Z", "+00:00"))
            elapsed_hours = (ack_dt - created).total_seconds() / 3600
            sla_met = elapsed_hours <= sla_hours
        except Exception:
            sla_met = True

        db.collection("aims_requests").document(aims_id).update({
            "status":          "acknowledged",
            "acknowledged_at": ack_time,
            "updated_at":      ack_time,
            "sla_met":         sla_met,
        })
        logger.info(f"[aims_bridge] {aims_id} → change_request (cat={cr_category}, sla_met={sla_met})")
        bridged += 1
    return bridged


@app.post("/orchestrate/process-queue")
async def process_queue():
    """Bridge AIMS requests, then pull submitted change_requests and route each one."""
    aims_bridged = bridge_aims_requests()

    snap = (
        db.collection("change_requests")
        .where("status", "==", "submitted")
        .order_by("created_at")
        .limit(50)
        .get()
    )
    requests = [(doc.id, doc.to_dict()) for doc in snap]

    routed = {"defects": 0, "governance": 0, "delivery": 0, "skipped": 0}
    details = []

    for req_id, req in requests:
        category = req.get("category", "")
        try:
            if category == "bug_fix":
                defect_id = route_to_defect(req_id, req)
                routed["defects"] += 1
                details.append({"req_id": req_id, "routed_to": "defects", "id": defect_id})

            elif category == "question":
                route_to_governance(req_id, req)
                routed["governance"] += 1
                details.append({"req_id": req_id, "routed_to": "governance"})

            elif category in ("new_feature", "enhancement", "change_request"):
                r = route_to_delivery(req_id, req)
                routed["delivery"] += 1
                details.append({"req_id": req_id, **r})

            else:
                # Unknown category — mark as pending_response for Ben
                db.collection("change_requests").document(req_id).update({
                    "status": "pending_response",
                    "updated_at": now_iso(),
                })
                routed["skipped"] += 1
                details.append({"req_id": req_id, "routed_to": "pending_response"})

        except Exception as e:
            logger.error(f"[orchestrator] failed to route {req_id}: {e}")
            details.append({"req_id": req_id, "error": str(e)})

    logger.info(f"[orchestrate/process-queue] aims_bridged={aims_bridged}, processed={len(requests)}, routed={routed}")
    return {"aims_bridged": aims_bridged, "processed": len(requests), "routed": routed, "details": details}


@app.post("/orchestrate/check-health")
async def check_health():
    """Assess delivery system health and write a summary to Firestore."""
    # Critical open defects
    crit_snap = (
        db.collection("defects")
        .where("status", "!=", "resolved")
        .where("severity", "==", "critical")
        .get()
    )
    critical_defects = len(list(crit_snap))

    # Overdue engagements (building/testing past estimated_delivery)
    today = datetime.now(timezone.utc).date().isoformat()
    building_snap = (
        db.collection("engagements")
        .where("status", "in", ["building", "testing"])
        .get()
    )
    overdue = []
    for doc in building_snap:
        d = doc.to_dict()
        delivery = d.get("estimated_delivery", "")
        if delivery and delivery < today:
            overdue.append({"id": doc.id, "title": d.get("title", ""), "due": delivery})

    # Health score: 100 base, -20 per critical defect, -10 per overdue engagement
    health_score = max(0, 100 - (critical_defects * 20) - (len(overdue) * 10))

    summary = {
        "critical_defects": critical_defects,
        "overdue_engagements": len(overdue),
        "overdue_details": overdue,
        "over_budget": 0,  # Future: compare delivery_costs vs estimated_value_usd
        "health_score": health_score,
        "checked_at": now_iso(),
    }

    db.collection("delivery_health").document("latest").set(summary)
    logger.info(f"[orchestrate/check-health] score={health_score}, critical={critical_defects}, overdue={len(overdue)}")
    return summary
