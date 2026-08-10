require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Application = require("./models/Application");
const Job = require("./models/Job");
const path = require("path");
const multer = require("multer");
const transporter = require("./email");
const Employer = require("./models/Employer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Applicant = require("./models/Applicant");
const SavedJob = require("./models/SavedJob");
const Notification = require("./models/Notification");
const Activity = require("./models/Activity");
const crypto = require("crypto");
const Admin = require("./models/Admin");
const console = require("console");
const Feedback = require("./models/Feedback");

/*const JWT_SECRET = "your_secret_key";*/
const JWT_SECRET = process.env.JWT_SECRET;


console.log("I AM USING THE CORRECT SERVER.JS");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("NEW SERVER IS RUNNING");

// CV upload setup
const cvstorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/cvs/");
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const logostorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/logos/");
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const profileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/profiles/");
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const uploadCV = multer({
    storage: cvstorage,
    fileFilter: function(req, file, cb) {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed."));
        }
    }
});

const uploadLogo = multer({
    storage: logostorage,
        fileFilter: function(req, file, cb) {
            if (file.mimetype === "image/jpeg" ||
                 file.mimetype === "image/png" ||
                 file.mimetype === "image/jpg"
                ) {
                cb(null, true);
            } else {
                cb(new Error("Only JPG, PNG, and JPEG files are allowed."));
            }
        }
    });

    const uploadProfilePhoto = multer({
        storage: profileStorage,
        fileFilter: function(req, file, cb) {
            if (file.mimetype === "image/jpeg" ||
                 file.mimetype === "image/png" ||
                 file.mimetype === "image/jpg"
                ) {
                cb(null, true);
            } else {
                cb(new Error("Only JPG, JPEG, and PNG files are allowed."));
            }
        }
    });

// Save application
app.post("/apply", verifyApplicant, uploadCV.single("cv"), async (req, res) => {
    console.log("APPLY ROUTE HIT");

    try {
        const application = new Application({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            job: req.body.job,
            jobTitle: req.body.jobTitle,
            cv: req.file ? req.file.filename : null,
            applicantId: req.applicantId,
            jobId: req.body.jobId,
        });

        await application.save();

        await Activity.create({
            message: `${application.name} applied for ${application.jobTitle}.`,
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "pmax53725@gmail.com",
            subject: "New Job Application",
            text: `
A new application has been received.

Name: ${application.name}
Email: ${application.email}
Phone: ${application.phone}
Job: ${application.jobTitle}
`
        });


  await transporter.sendMail({

    from: process.env.EMAIL_USER,

    to: application.email,

    subject: "Application Received",
    

    text: `Dear ${application.name},

Thank you for applying for the ${application.jobTitle} position.

We have successfully received your application and CV.

Our recruitment team will review your application and contact you if you are Shortlisted.

Best regards,

Rm nyaga`

});


        console.log("APPLICATION SAVED");
        console.log(application);

        res.json({
            message: "Application submitted successfully!"
        });

    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message || "Failed to save application."
        });
    }
});


// Get applications for the logged-in employer
app.get("/api/applications", employerAuth, async (req, res) => {

    try {

        // Find jobs belonging to this employer
        const employerJobs = await Job.find({
            employerId: req.employer.employerId
        }).select("_id");

        const jobIds = employerJobs.map(job => job._id);

        // Find applications for those jobs
        const applications = await Application.find({
            jobId: { $in: jobIds }
        }).populate("applicantId");

        res.json(applications);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch applications."
        });

    }

});


// Update application status
app.put("/api/applications/:id", employerAuth, async (req, res) => {

    console.log("=== STATUS UPDATE ROUTE REACHED ===");

    try {

        const application = await Application.findById(
            req.params.id
        ).populate("applicantId");

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        // Make sure this application belongs to a job
        // posted by the logged-in employer
        const job = await Job.findOne({
            _id: application.jobId,
            employerId: req.employer.employerId
        });

        if (!job) {
            return res.status(403).json({
                message: "You do not have permission to update this application."
            });
        }

        // Update status
        application.status = req.body.status;

        await application.save();

        console.log("Status saved:", application.status);

        // Create notification for applicant
        if (application.applicantId) {

            try {

                const notification = await Notification.create({
                    applicantId: application.applicantId._id,
                    message: `Your application for ${application.jobTitle} has been ${application.status}.`
                });

                console.log("Notification created:", notification);

            } catch (notificationError) {

                console.log("NOTIFICATION CREATION ERROR:");
                console.log(notificationError.message);

            }

        }

        // Shortlisted email
        if (application.status === "Shortlisted") {

            try {

                await transporter.sendMail({

                    from: process.env.EMAIL_USER,

                    to: application.email,

                    subject: "Congratulations! You have been Shortlisted",

                    text: `Dear ${application.name},

Congratulations!

We are pleased to inform you that you have been Shortlisted for the ${application.jobTitle} position.

Our recruitment team will contact you soon with the next steps.

Best regards,

Norvim`

                });

                console.log("Shortlisted email sent successfully");

            } catch (emailError) {

                console.log("SHORTLISTED EMAIL ERROR:");
                console.log(emailError);

            }

        }

        // Rejected email
        if (application.status === "Rejected") {

            try {

                await transporter.sendMail({

                    from: process.env.EMAIL_USER,

                    to: application.email,

                    subject: "Update on your job application",

                    text: `Dear ${application.name},

Thank you for taking the time to apply for the ${application.jobTitle} position.

After careful consideration, we regret to inform you that you have not been selected for this role.

We appreciate your interest in our company and encourage you to apply for future opportunities.

We wish you all the best.

Norvim`

                });

            } catch (emailError) {

                console.log("REJECTED EMAIL ERROR:");
                console.log(emailError);

            }

        }

        res.json(application);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update status"
        });

    }

});


// Delete application
app.delete("/api/admin/applications/:id", adminAuth, async (req, res) => {

    try {

        const application = await Application.findById(req.params.id);

        if (!application) {

            return res.status(404).json({
                message: "Application not found"
            });

        }

        await Application.findByIdAndDelete(req.params.id);

        res.json({
            message: "Application deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to delete application"
        });

    }

});
async function employerAuth(req, res, next) {

    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    try {

        const decoded = jwt.verify(
            token.replace("Bearer ", ""),
            JWT_SECRET
        );

        const employer = await Employer.findById(decoded.employerId);

        if (!employer) {
            return res.status(401).json({
                message: "Employer account not found"
            });
        }

        // Check email verification
        if (!employer.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before accessing your employer account."
            });
        }

        // Check account suspension
        if (employer.status === "Suspended") {

            return res.status(403).json({
                message: "Your account has been suspended by the administrator."
            });

        }

        req.employer = decoded;

        next();

    } catch (error) {

        res.status(401).json({
            message: "Invalid token"
        });

    }

}
async function adminAuth(req, res, next) {

    try {

        const token = req.headers.authorization?.split(" ")[1];


        if (!token) {

            return res.status(401).json({
                message: "No admin token"
            });

        }


        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

     console.log("ADMIN AUTH TOKEN VERIFIED");
     console.log("ADMIN DECODED:", decoded);
     console.log("ADMIN ROLE:", decoded.role);


        if (decoded.role !== "admin") {

    return res.status(403).json({
        message: "Access denied"
    });

}

req.admin = decoded;

next();


    } catch (error) {

        res.status(401).json({
            message: "Invalid admin token"
        });

    }

}

/*async function adminAuth(req, res, next) {

    try {

        console.log("Authorization Header:", req.headers.authorization);

        const token = req.headers.authorization?.split(" ")[1];

        console.log("Extracted Token:", token);

        const decoded = jwt.verify(token, JWT_SECRET);

        console.log("Decoded Token:", decoded);

        req.admin = decoded;

        next();

    } catch (error) {

        console.log("Admin Auth Error:", error.message);

        return res.status(401).json({
            message: "Invalid admin token"
        });

    }

}
*/


// Create a new job
app.post("/api/jobs", employerAuth, uploadLogo.single("logo"), async (req, res) => {
    try {
        const job = new Job({
            title: req.body.title,
            company: req.body.company,
            category: req.body.category,
            location: req.body.location,
            salary: req.body.salary,
            description: req.body.description,
            logo: req.file ? "uploads/logos/" + req.file.filename : null,
            employerId: req.employer.employerId
        });

        await job.save();
        const applicants = await Applicant.find({}, "_id");

        const notifications = applicants.map(applicant => ({
            applicantId: applicant._id,
            message: `📢 New job posted: ${job.title} at ${job.company}.`
        }));

        await Notification.insertMany(notifications);

        res.json({
            success: true,
            message: "Job posted successfully"
        });

        await Activity.create({
            message: `${job.company} posted a new job: ${job.title}.`
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to post job"
        });
    }
});

// Get all jobs
app.get("/api/jobs", async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;

        const limit = 10;

        const skip = (page - 1) * limit;

       const activeFilter = {
    $or: [
        { status: "Active" },
        { status: { $exists: false } }
    ]
};

const totalJobs = await Job.countDocuments(activeFilter);

const jobs = await Job.find(activeFilter)
    .populate(
        "employerId",
        "companyName logo companyDescription industry website companySize foundedYear location"
    )
    .skip(skip)
    .limit(limit);

        res.json({

            jobs,

            currentPage: page,

            totalPages: Math.ceil(totalJobs / limit)

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load jobs"
        });

    }

});

// Dashboard statistics
app.get("/api/dashboard/stats", async (req, res) => {
    try {

        const totalJobs = await Job.countDocuments();
const totalApplications = await Application.countDocuments();
const totalApplicants = await Applicant.countDocuments();
const totalEmployers = await Employer.countDocuments();

res.json({
    totalJobs,
    totalApplications,
    totalApplicants,
    totalEmployers
});

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load dashboard statistics"
        });

    }
});

// Get single job
app.get("/api/jobs/:id", async (req, res) => {

    try {

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        res.json(job);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load job"
        });

    }

});
/*
app.get("/api/jobs/:id", async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        res.json(job);

    } catch (error) {
        res.status(500).json({
            message: "Failed to load job"
        });
    }
});*/

// Get company profile and its jobs
app.get("/api/company/:id", async (req, res) => {

    try {

        const company = await Employer.findById(req.params.id);

        if (!company) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        const jobs = await Job.find({
            employerId: req.params.id,
            $or: [
                { status: "Active" },
                { status: { $exists: false } }
            ]
        });

        res.json({
            company,
            jobs
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load company profile"
        });

    }

});

//delete job
app.delete("/api/jobs/:id", employerAuth, async (req, res) => {

    try {

        const job = await Job.findOne({
            _id: req.params.id,
            employerId: req.employer.employerId
        });

        if (!job) {

            return res.status(404).json({
                success: false,
                message: "Job not found or you don't have permission to delete it."
            });

        }

        await Job.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Job deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete job"
        });

    }

});


// Admin delete job
app.delete("/api/admin/jobs/:id", adminAuth, async (req, res) => {

    try {

        await Job.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Job deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete job"
        });

    }

});

// Admin update job
app.put("/api/admin/jobs/:id", adminAuth, async (req, res) => {

    try {

        const job = await Job.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                company: req.body.company,
                location: req.body.location,
                salary: req.body.salary,
                description: req.body.description
            },
            {
                new: true
            }
        );

        res.json({
            success: true,
            job
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update job"
        });

    }

});

app.get("/api/admin/applicants", adminAuth, async (req, res) => {

    try {

        const applicants = await Applicant.find().select("-password");

        res.json(applicants);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load applicants"
        });

    }

});

// Get all applications for admin
app.get("/api/admin/applications", adminAuth, async (req, res) => {

    try {

        const applications = await Application.find()
            .populate("applicantId")
            .populate("jobId");

        res.json(applications);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load applications"
        });

    }

});

// Admin update application status
app.put("/api/admin/applications/:id", adminAuth, async (req, res) => {

    try {

        const application = await Application.findById(
            req.params.id
        ).populate("applicantId");

        if (!application) {

            return res.status(404).json({
                message: "Application not found"
            });

        }

        application.status = req.body.status;

        await application.save();

        // Create notification for applicant
        if (application.applicantId) {

            await Notification.create({
                applicantId: application.applicantId._id,
                message: `Your application for ${application.jobTitle} has been ${application.status}.`
            });

        }

        // Shortlisted email
        if (application.status === "Shortlisted") {

            try {

                await transporter.sendMail({

                    from: process.env.EMAIL_USER,

                    to: application.email,

                    subject: "Congratulations! You have been Shortlisted",

                    text: `Dear ${application.name},

Congratulations!

We are pleased to inform you that you have been Shortlisted for the ${application.jobTitle} position.

Our recruitment team will contact you soon with the next steps.

Best regards,

Norvim`

                });

            } catch (emailError) {

                console.log("SHORTLISTED EMAIL ERROR:", emailError);

            }

        }

        // Rejected email
        if (application.status === "Rejected") {

            try {

                await transporter.sendMail({

                    from: process.env.EMAIL_USER,

                    to: application.email,

                    subject: "Update on your job application",

                    text: `Dear ${application.name},

Thank you for taking the time to apply for the ${application.jobTitle} position.

After careful consideration, we regret to inform you that you have not been selected for this role.

We appreciate your interest in our company and encourage you to apply for future opportunities.

We wish you all the best.

Norvim`

                });

            } catch (emailError) {

                console.log("REJECTED EMAIL ERROR:", emailError);

            }

        }

        res.json(application);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update application"
        });

    }

});


app.get("/api/admin/employers", adminAuth, async (req, res) => {

    try {

        const employers = await Employer.find().select("-password");

        // 👇 Put the new block here
        const employersWithJobs = await Promise.all(

            employers.map(async (employer) => {

                const jobsPosted = await Job.countDocuments({
                    employerId: employer._id
                });

                const activeJobs = await Job.countDocuments({
                    employerId: employer._id,
                    status: "Active"
                });

                const closedJobs = await Job.countDocuments({
                    employerId: employer._id,
                    status: "Closed"
                });

                return {
                    ...employer.toObject(),
                    jobsPosted,
                    activeJobs,
                    closedJobs
                };

            })

        );

        res.json(employersWithJobs);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load employers"
        });

    }

});

app.put("/api/admin/employers/:id/status", adminAuth, async (req, res) => {

    try {

        const employer = await Employer.findById(req.params.id);

        if (!employer) {
            return res.status(404).json({
                message: "Employer not found"
            });
        }

        employer.status =
            employer.status === "Active"
                ? "Suspended"
                : "Active";

        await employer.save();

        res.json({
            message: `Employer ${employer.status} successfully`
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.get("/api/admin/activities", adminAuth, async (req, res) => {

    try {

        const activities = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(activities);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.put("/api/admin/activities/:id", adminAuth, async (req, res) => {

    try {

        await Activity.findByIdAndUpdate(
            req.params.id,
            { read: true }
        );

        res.json({
            message: "Activity marked as read"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.put("/api/admin/activities/read-all", adminAuth, async (req, res) => {

    try {

        await Activity.updateMany(
            { read: false },
            { read: true }
        );

        res.json({
            message: "All activities marked as read"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.delete("/api/admin/activities/:id", adminAuth, async (req, res) => {

    try {

        await Activity.findByIdAndDelete(req.params.id);

        res.json({
            message: "Activity deleted"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.delete("/api/admin/activities", adminAuth, async (req, res) => {

    try {

        await Activity.deleteMany({});

        res.json({
            message: "All activities deleted"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});



app.post("/api/admin/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        const admin = await Admin.findOne({
            email: email
        });


        if (!admin) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        const isMatch = await bcrypt.compare(
            password,
            admin.password
        );


        if (!isMatch) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        const token = jwt.sign(

    {
        adminId: admin._id,
        role: "admin"
    },

    JWT_SECRET,

    {
        expiresIn: "1d"
    }

);


        res.json({

            token,

            message: "Login successful"

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});


// update job
app.put("/api/jobs/:id", employerAuth, async (req, res) => {

    try {

        const job = await Job.findOne({
            _id: req.params.id,
            employerId: req.employer.employerId
        });

        if (!job) {

            return res.status(404).json({
                success: false,
                message: "Job not found or you don't have permission to edit it."
            });

        }

        job.title = req.body.title;
        job.company = req.body.company;
        job.location = req.body.location;
        job.salary = req.body.salary;
        job.description = req.body.description;

        await job.save();

        res.json({
            success: true,
            job
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update job"
        });

    }

});
app.post("/api/employers/register", uploadLogo.single("logo"), async (req, res) => {

    try {

        const { companyName, email, password } = req.body;

        const existingEmployer = await Employer.findOne({ email });

        if (existingEmployer) {

            return res.status(400).json({
                message: "Email already registered"
            });

        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit verification code
        const verificationCode =
            Math.floor(100000 + Math.random() * 900000).toString();

        // Code expires in 10 minutes
        const verificationCodeExpires =
            new Date(Date.now() + 10 * 60 * 1000);

        // Create employer
        const employer = new Employer({

            companyName,
            email,
            password: hashedPassword,
            logo: req.file ? req.file.filename : "",

            isVerified: false,
            verificationCode,
            verificationCodeExpires

        });

        await employer.save();

        await Activity.create({
            message: `${employer.companyName} registered as an employer.`
        });

        // Send verification email
        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: email,

            subject: "Verify your Norvim employer account",

            text: `Hello ${companyName},

Your Norvim employer verification code is:

${verificationCode}

This code expires in 10 minutes.

If you did not create this employer account, you can ignore this email.

Thank you,
Norvim`

        });

        res.status(201).json({

            message:
                "Employer registration successful. Please check your email for the verification code."

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Registration failed"

        });

    }

});

app.post("/api/employers/verify", async (req, res) => {

    try {

        const { email, verificationCode } = req.body;

        const employer = await Employer.findOne({ email });

        if (!employer) {
            return res.status(404).json({
                message: "Employer not found"
            });
        }

        if (employer.isVerified) {
            return res.status(400).json({
                message: "Account is already verified"
            });
        }

        if (
            !employer.verificationCode ||
            employer.verificationCode !== verificationCode
        ) {
            return res.status(400).json({
                message: "Invalid verification code"
            });
        }

        if (
            !employer.verificationCodeExpires ||
            new Date() > employer.verificationCodeExpires
        ) {
            return res.status(400).json({
                message: "Verification code has expired"
            });
        }

        // Verify employer
        employer.isVerified = true;

        // Remove verification code after successful verification
        employer.verificationCode = undefined;
        employer.verificationCodeExpires = undefined;

        await employer.save();

        res.json({
            message: "Email verified successfully. You can now log in."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.post("/api/employers/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const employer = await Employer.findOne({ email });

        if (!employer) {

            return res.status(400).json({
                message: "Invalid email or password"
            });

        }

        const passwordMatch =
            await bcrypt.compare(password, employer.password);

        if (!passwordMatch) {

            return res.status(400).json({
                message: "Invalid email or password"
            });

        }

        // Check email verification
        if (!employer.isVerified) {

            return res.status(403).json({
                message: "Please verify your email before logging in."
            });

        }

        const token = jwt.sign(

            {
                employerId: employer._id
            },

            JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );

        res.json({

            message: "Login successful",

            token,

            employer: {

                id: employer._id,

                companyName: employer.companyName,

                email: employer.email,

                logo: employer.logo

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Login failed"

        });

    }

});

app.post("/api/employers/forgot-password", async (req, res) => {

    try {

        const employer = await Employer.findOne({
            email: req.body.email
        });

        if (!employer) {
            return res.status(404).json({
                message: "No account found with that email."
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        employer.resetToken = resetToken;

        employer.resetTokenExpires =
            Date.now() + 15 * 60 * 1000;

        await employer.save();


        const resetLink =
        `http://localhost:3000/employer-reset-password.html?token=${resetToken}`;


        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: employer.email,

            subject: "Employer Password Reset",

            text: `Hello ${employer.companyName},

You requested to reset your password.

Click the link below:

${resetLink}

This link expires in 15 minutes.

If you did not request this, ignore this email.`

        });


        res.json({
            message: "Password reset link sent."
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.post("/api/employers/reset-password", async (req, res) => {

    try {

        const { token, password } = req.body;


        const employer = await Employer.findOne({

            resetToken: token,

            resetTokenExpires: {
                $gt: Date.now()
            }

        });


        if (!employer) {

            return res.status(400).json({

                message: "Invalid or expired reset link."

            });

        }


        const hashedPassword = await bcrypt.hash(password, 10);


        employer.password = hashedPassword;


        employer.resetToken = undefined;

        employer.resetTokenExpires = undefined;


        await employer.save();


        res.json({

            message: "Password reset successfully."

        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            message: error.message

        });

    }

});

app.delete("/api/employers/account", employerAuth, async (req, res) => {

    try {

        const employerId = req.employer.employerId;


        // Find employer jobs
        const jobs = await Job.find({
            employerId: employerId
        });


        const jobIds = jobs.map(job => job._id);


        // Delete applications for those jobs
        await Application.deleteMany({
            job: {
                $in: jobIds
            }
        });


        // Delete employer jobs
        await Job.deleteMany({
            employerId: employerId
        });


        // Delete employer account
        await Employer.findByIdAndDelete(employerId);


        res.json({
            message: "Employer account deleted successfully."
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.put("/api/employers/company-profile", employerAuth, async (req, res) => {

    try {

        const employer = await Employer.findByIdAndUpdate(

            req.employer.employerId,

            {
                companyDescription: req.body.companyDescription,
                industry: req.body.industry,
                website: req.body.website,
                location: req.body.location,
                companySize: req.body.companySize,
                foundedYear: req.body.foundedYear
            },

            {
                new: true
            }

        );

        res.json({
            message: "Company profile updated successfully.",
            employer
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.get("/api/employers/profile", employerAuth, async (req, res) => {

    try {

        const employer = await Employer.findById(
            req.employer.employerId
        );

        res.json(employer);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

// Applicant Registration
app.post("/api/applicants/register", async (req, res) => {

    try {

        const { name, email, phone, password } = req.body;

        // Check if applicant already exists
        const existingApplicant = await Applicant.findOne({ email });

        if (existingApplicant) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit verification code
        const verificationCode =
            Math.floor(100000 + Math.random() * 900000).toString();

        // Code expires in 10 minutes
        const verificationCodeExpires =
            new Date(Date.now() + 10 * 60 * 1000);

        // Create applicant
        const applicant = new Applicant({
            name,
            email,
            phone,
            password: hashedPassword,
            isVerified: false,
            verificationCode,
            verificationCodeExpires
        });

        await applicant.save();

        await Activity.create({
            message: `${applicant.name} registered as an applicant.`
        });

        // Send verification email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your Norvim account",
            text: `Hello ${name},

Your Norvim verification code is:

${verificationCode}

This code expires in 10 minutes.

If you did not create this account, you can ignore this email.

Thank you,
Norvim`
        });

        res.status(201).json({
            message: "Registration successful. Please check your email for the verification code."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.post("/api/applicants/verify", async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        const applicant = await Applicant.findOne({ email });

        if (!applicant) {
            return res.status(404).json({
                message: "Applicant not found"
            });
        }

        if (applicant.isVerified) {
            return res.status(400).json({
                message: "Account is already verified"
            });
        }

        if (!applicant.verificationCode ||
            applicant.verificationCode !== verificationCode) {
            return res.status(400).json({
                message: "Invalid verification code"
            });
        }

        if (new Date() > applicant.verificationCodeExpires) {
            return res.status(400).json({
                message: "Verification code has expired"
            });
        }

        applicant.isVerified = true;
        applicant.verificationCode = undefined;
        applicant.verificationCodeExpires = undefined;

        await applicant.save();

        res.json({
            message: "Email verified successfully. You can now log in."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
});


// Applicant Login
app.post("/api/applicants/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        const applicant = await Applicant.findOne({ email });


        if (!applicant) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }


        const isMatch = await bcrypt.compare(password, applicant.password);


        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }


        const token = jwt.sign(
            {
                id: applicant._id,
                role: "applicant"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );


        res.json({

            message: "Login successful",

            token,

            applicant: {
                id: applicant._id,
                name: applicant.name,
                email: applicant.email
            }

        });


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.post("/api/applicants/forgot-password", async (req, res) => {

    try {

        const applicant = await Applicant.findOne({
            email: req.body.email
        });

        if (!applicant) {
            return res.status(404).json({
                message: "No account found with that email."
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        applicant.resetToken = resetToken;
        applicant.resetTokenExpires = Date.now() + 15 * 60 * 1000;

        await applicant.save();

        const resetLink =
            `http://localhost:3000/reset-password.html?token=${resetToken}`;

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: applicant.email,

            subject: "Password Reset",

            text: `Hello ${applicant.name},

You requested to reset your password.

Click the link below to reset it:

${resetLink}

This link will expire in 15 minutes.

If you did not request this, please ignore this email.`

        });

        res.json({
            message: "Password reset link sent successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.post("/api/applicants/reset-password", async (req, res) => {

    try {

        const { token, password } = req.body;

        const applicant = await Applicant.findOne({

            resetToken: token,

            resetTokenExpires: {
                $gt: Date.now()
            }

        });

        if (!applicant) {

            return res.status(400).json({
                message: "Invalid or expired reset link."
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        applicant.password = hashedPassword;

        applicant.resetToken = undefined;
        applicant.resetTokenExpires = undefined;

        await applicant.save();

        res.json({
            message: "Password reset successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.get("/api/applicants/applications", verifyApplicant, async (req, res) => {

    try {

        const applications = await Application.find({
            applicantId: req.applicantId
        }).populate("jobId");

        res.json(applications);

    } catch(error) {

        res.status(500).json({
            message: error.message
        });

    }

});
async function verifyApplicant(req, res, next) {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const applicant = await Applicant.findById(decoded.id);

        if (!applicant) {
            return res.status(401).json({
                message: "Applicant account not found"
            });
        }

        // Check email verification
        if (!applicant.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before accessing your applicant account."
            });
        }

        req.applicantId = decoded.id;

        next();

    } catch (error) {

        res.status(401).json({
            message: "Invalid token"
        });

    }

}
app.delete("/api/applicants/account", verifyApplicant, async (req, res) => {

    try {

        const applicantId = req.applicantId;


        // Delete applicant notifications
        await Notification.deleteMany({
            applicantId: applicantId
        });


        // Delete applicant applications
        await Application.deleteMany({
            applicantId: applicantId
        });


        // Delete saved jobs (if you have SavedJob model)
        // await SavedJob.deleteMany({
        //     applicantId: applicantId
        // });


        // Delete applicant account
        await Applicant.findByIdAndDelete(applicantId);


        res.json({
            message: "Account deleted successfully."
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

// Get employer profile
app.get("/api/employers/profile", async (req, res) => {

    try {

        const token = req.headers.authorization.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        const employer = await Employer.findById(decoded.employerId).select("-password");

        res.json(employer);

    } catch (error) {

        res.status(401).json({
            message: "Unauthorized"
        });

    }

});

// Update employer profile
app.put("/api/employers/profile", uploadLogo.single("logo"), async (req, res) => {

    try {

        const token = req.headers.authorization.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

       const { companyName, email, phone } = req.body;

const updateData = {

    companyName,
    email,
    phone

};

if (req.file) {

    updateData.logo = "uploads/logos/" + req.file.filename;

}

const employer = await Employer.findByIdAndUpdate(

    decoded.employerId,

    updateData,

    {
        new: true
    }

).select("-password");

        res.json({

            message: "Profile updated successfully",

            employer

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to update profile"

        });

    }

});

// Change employer password
app.put("/api/employers/change-password", async (req, res) => {

    try {

        const token = req.headers.authorization.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        const { currentPassword, newPassword } = req.body;

        const employer = await Employer.findById(decoded.employerId);

        if (!employer) {
            return res.status(404).json({
                message: "Employer not found"
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            employer.password
        );

        if (!passwordMatch) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        employer.password = hashedPassword;

        await employer.save();

        res.json({
            message: "Password changed successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to change password"
        });

    }

});

// Update job status
app.put("/api/jobs/:id/status", async (req, res) => {

    try {

        const { status } = req.body;

        const job = await Job.findByIdAndUpdate(

            req.params.id,

            {
                status
            },

            {
                new: true
            }

        );

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        res.json({
            message: `Job status changed to ${status}`,
            job
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update job status"
        });

    }

});



// Get jobs posted by logged-in employer
app.get("/api/employer/jobs", employerAuth, async (req, res) => {

    try {

        const jobs = await Job.find({
            employerId: req.employer.employerId
        });

        res.json(jobs);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load employer jobs"
        });

    }

});

app.get("/api/employer/applications", employerAuth, async (req, res) => {
    try {

        const jobs = await Job.find({
            employerId: req.employer.employerId
        });

        const jobIds = jobs.map(job => job._id);

        const applications = await Application.find({
    job: { $in: jobIds }
})
.populate("job")
.populate("applicantId", "-password");

        res.json(applications);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load applications"
        });

    }
});

app.put("/api/employer/applications/:id/status", employerAuth, async (req, res) => {

    try {

        const application = await Application.findById(req.params.id).populate("job");

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (
            application.job.employerId.toString() !==
            req.employer.employerId
        ) {
            return res.status(403).json({
                message: "You are not allowed to update this application."
            });
        }

        application.status = req.body.status;

        await application.save();

        await Activity.create({
            message: `${application.name} was ${application.status} for ${application.jobTitle}.`
        });

        await Notification.create({
            applicantId: application.applicantId,
            message: `Your application for ${application.jobTitle} has been ${req.body.status}.`
        });

        if (application.status === "Shortlisted") {

            await transporter.sendMail({

                from:  process.env.EMAIL_USER,

                to: application.email,

                subject: "Congratulations! You have been Shortlisted",

                text: `Dear ${application.name},

Congratulations!

We are pleased to inform you that you have been Shortlisted for the ${application.jobTitle} position.

Our recruitment team will contact you soon with the next steps.

Best regards,

Engineering Jobs Team`

            });

        }

        if (application.status === "Rejected") {

            await transporter.sendMail({

                from: process.env.EMAIL_USER,

                to: application.email,

                subject: "Update on your job application",

                text: `Dear ${application.name},

Thank you for taking the time to apply for the ${application.jobTitle} position.

After careful consideration, we regret to inform you that you have not been selected.

We appreciate your interest and wish you all the best.

Engineering Jobs Team`

            });

        }

        res.json({
            message: "Status updated successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update application status"
        });

    }

});

app.get("/api/applicants/profile", verifyApplicant, async (req, res) => {

    try {

        const applicant = await Applicant.findById(req.applicantId).select("-password");

        if (!applicant) {
            return res.status(404).json({
                message: "Applicant not found"
            });
        }

        res.json(applicant);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.get("/api/applicants/:id", async (req, res) => {

    try {

        const applicant = await Applicant.findById(req.params.id)
        .select("-password");


        if (!applicant) {

            return res.status(404).json({
                message: "Applicant not found"
            });

        }


        res.json(applicant);


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


app.put("/api/applicants/profile", verifyApplicant, uploadProfilePhoto.single("profilePhoto"), async (req, res) => {
   console.log("I AM INSIDE APPLICANT PROFILE UPDATE");
    try {
        
        const {
    name,
    email,
    phone,
    about,
    skills,
    education,
    experience,
    linkedin,
    portfolio
} = req.body;

        const updateData = {
    name,
    email,
    phone,
    about,
    skills,
    education,
    experience,
    linkedin,
    portfolio
};

if (req.file) {
    updateData.profilePhoto = "uploads/profiles/" + req.file.filename;
}

        const applicant = await Applicant.findByIdAndUpdate(
            req.applicantId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select("-password");


        res.json({
            message: "Profile updated successfully",
            applicant
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.put("/api/applicants/change-password", verifyApplicant, async (req, res) => {

    try {

        const { currentPassword, newPassword } = req.body;

        const applicant = await Applicant.findById(req.applicantId);

        if (!applicant) {
            return res.status(404).json({
                message: "Applicant not found"
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            applicant.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }

        applicant.password = await bcrypt.hash(newPassword, 10);

        await applicant.save();

        res.json({
            message: "Password changed successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.put("/api/applicants/applications/:id/withdraw", verifyApplicant, async (req, res) => {

    try {

        const application = await Application.findOne({
            _id: req.params.id,
            applicantId: req.applicantId
        });

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        application.status = "Withdrawn";

        await application.save();

        res.json({
            message: "Application withdrawn successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.post("/api/saved-jobs", verifyApplicant, async (req, res) => {

    try {

        const { jobId } = req.body;


        const existing = await SavedJob.findOne({

            applicantId: req.applicantId,

            jobId: jobId

        });


        if (existing) {

            return res.json({

                message: "You have already saved this job."

            });

        }


        const savedJob = new SavedJob({

            applicantId: req.applicantId,

            jobId: jobId

        });


        await savedJob.save();


        res.json({

            message: "Job saved successfully!"

        });


    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

});

app.get("/api/saved-jobs", verifyApplicant, async (req, res) => {

    try {

        const savedJobs = await SavedJob.find({
            applicantId: req.applicantId
        }).populate("jobId");


        res.json(savedJobs);


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.delete("/api/saved-jobs/:id", verifyApplicant, async (req, res) => {

    try {

        await SavedJob.findOneAndDelete({

            _id: req.params.id,

            applicantId: req.applicantId

        });


        res.json({

            message: "Saved job removed"

        });


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.get("/api/notifications", verifyApplicant, async (req, res) => {

    try {

        const notifications = await Notification.find({
            applicantId: req.applicantId
        })
        .sort({ createdAt: -1 });

        res.json(notifications);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.put("/api/notifications/read-all", verifyApplicant, async (req, res) => {

    try {

        await Notification.updateMany(
            {
                applicantId: req.applicantId,
                read: false
            },
            {
                read: true
            }
        );

        res.json({
            message: "All notifications marked as read"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.put("/api/notifications/:id", verifyApplicant, async (req, res) => {

    try {

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                applicantId: req.applicantId
            },
            {
                read: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.json(notification);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.delete("/api/notifications/:id", verifyApplicant, async (req, res) => {

    try {

        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            applicantId: req.applicantId
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.json({
            message: "Notification deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.post("/api/feedback", async (req, res) => {

    try {

        const { name, email, role, message } = req.body;

        const feedback = new Feedback({
            name,
            email,
            role,
            message
        });

        await feedback.save();

        res.json({
            message: "Thank you for your feedback!"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to send feedback."
        });

    }

});

app.get("/api/admin/feedback", adminAuth, async (req, res) => {

    try {

        const feedback = await Feedback.find()
            .sort({ createdAt: -1 });

        res.json(feedback);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});

app.delete("/api/admin/feedback/:id", adminAuth, async (req, res) => {

    try {

        await Feedback.findByIdAndDelete(req.params.id);

        res.json({
            message: "Feedback deleted successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});


app.use(express.static(path.join(__dirname, "public")));

// Make uploads folder accessible
app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB connected successfully");
})
.catch((error) => {
    console.log("MongoDB connection error:", error);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});