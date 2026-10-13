const placeholder = "00000000-0000-4000-8000-000000000000";
const databaseId = process.env.MALIKS_GROUP_D1_DATABASE_ID?.trim();

if (!databaseId || databaseId === placeholder) {
  console.error(
    "Deployment stopped: set MALIKS_GROUP_D1_DATABASE_ID to the Maliks Group-owned D1 database ID.",
  );
  process.exit(1);
}

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(databaseId)) {
  console.error("Deployment stopped: MALIKS_GROUP_D1_DATABASE_ID is not a valid database ID.");
  process.exit(1);
}

console.log("Independent production resource configuration is ready.");
