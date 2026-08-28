import { env } from "cloudflare:workers";
import { canAccessWorkspace, canWrite, getHubMember } from "../../access";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "You cannot edit wholesale records." }, { status: 403 });
  const p = (await req.json()) as Record<string, string | number>;
  for (const key of [
    "customer_name",
    "contact_person",
    "contact",
    "email",
    "customer_type",
    "province",
    "region",
    "zone",
    "quotation_no",
    "order_no",
    "value",
    "gp_percent",
    "stage",
    "assigned_to",
    "coordinator",
    "monthly_target",
    "last_visit",
    "next_follow_up",
    "next_action",
    "potential_value",
    "probability",
    "quote_date",
    "quote_follow_up_date",
    "quote_status",
    "invoice_no",
    "confirmed_date",
    "delivery_status",
    "delivery_eta",
    "delivered_date",
    "delivery_notes",
    "registered_name",
    "registration_number",
    "vat_number",
    "nature_of_business",
    "years_in_business",
    "branch_count",
    "head_office_address",
    "postal_code",
    "website",
    "legal_entity",
    "owner1_name",
    "owner1_id",
    "owner1_position",
    "owner1_mobile",
    "owner2_name",
    "owner2_id",
    "owner2_position",
    "owner2_mobile",
    "purchasing_contact_name",
    "purchasing_contact_mobile",
    "purchasing_contact_email",
    "accounts_contact_name",
    "accounts_contact_mobile",
    "accounts_contact_email",
    "delivery_address",
    "delivery_contact",
    "delivery_contact_mobile",
    "receiving_hours",
    "delivery_requirements",
    "product_categories",
    "average_monthly_spend",
    "ordering_method",
    "ordering_frequency",
    "payment_terms",
    "credit_requested",
    "price_group",
    "declaration_accepted",
    "approval_comments",
  ])
    if (p[key] !== undefined)
      await env.DB.prepare(
        `UPDATE wholesale_opportunities SET ${key}=? WHERE id=?`,
      )
        .bind(p[key], id)
        .run();
  return Response.json({ ok: true });
}
