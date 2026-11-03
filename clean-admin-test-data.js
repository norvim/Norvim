require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const PaymentTransaction = require("./models/PaymentTransaction");
const Activity = require("./models/Activity");

(async()=>{
  try {
    if (process.env.CONFIRM_ADMIN_CLEAN !== "YES") throw new Error("Safety stop: set CONFIRM_ADMIN_CLEAN=YES before running this cleanup.");
    await mongoose.connect(process.env.MONGO_URI);
    const adminEmail = String(process.env.ADMIN_EMAIL || "admin@engjobs.com").trim().toLowerCase();
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) throw new Error(`Admin account not found: ${adminEmail}`);
    admin.balance = 0;
    await admin.save();
    const deletedPayments = await PaymentTransaction.deleteMany({ type: "admin_topup", "metadata.adminId": String(admin._id) });
    const deletedActivities = await Activity.deleteMany({ kind: "payment", message: { $regex: "Admin wallet top-up", $options: "i" } });
    console.log(`Admin ${adminEmail} cleaned. Balance=KSh 0. Deleted ${deletedPayments.deletedCount} admin top-up records and ${deletedActivities.deletedCount} matching payment notifications.`);
  } catch(e){ console.error(e.message); process.exitCode=1; }
  finally { await mongoose.disconnect().catch(()=>{}); }
})();
