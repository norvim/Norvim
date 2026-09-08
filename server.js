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
const WorkerProfile = require("./models/workerProfile");
const ServiceCategory = require("./models/serviceCategory");
const LabourRequest = require("./models/LabourRequest");
const LabourBooking = require("./models/LabourBooking");
const CancellationReport = require("./models/CancellationReport");
const AccountTransaction = require("./models/AccountTransaction");
const PublicComment = require("./models/PublicComment");
const PremiumSubscription = require("./models/PremiumSubscription");
const PaymentTransaction = require("./models/PaymentTransaction");
const HomepageMedia = require("./models/HomepageMedia");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/*const JWT_SECRET = "your_secret_key";*/
const JWT_SECRET = process.env.JWT_SECRET;


console.log("I AM USING THE CORRECT SERVER.JS");

const app = express();

app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } }));
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");
app.use((req,res,next)=>{ res.setHeader("X-Content-Type-Options","nosniff"); res.setHeader("Referrer-Policy","strict-origin-when-cross-origin"); next(); });

console.log("NEW SERVER IS RUNNING");

// CV upload setup
const uploadCV = multer({
    storage: multer.memoryStorage(),
    fileFilter: function(req, file, cb) {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed."));
        }
    }
});

const uploadLogo = multer({
    storage: multer.memoryStorage(),
    fileFilter: function(req, file, cb) {
        if (
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/png" ||
            file.mimetype === "image/jpg"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, and JPEG files are allowed."));
        }
    }
});

const uploadHomepageMedia = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: function(req, file, cb) {
        const allowedImages = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        const allowedVideos = ["video/mp4", "video/webm", "video/quicktime", "video/mov"];
        if (allowedImages.includes(file.mimetype) || allowedVideos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed."));
        }
    }
});

const uploadProfilePhoto = multer({
    storage: multer.memoryStorage(),
    fileFilter: function(req, file, cb) {
        if (
            file.mimetype === "image/jpeg" ||
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

        let cvUrl = null;

if (req.file) {
    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "norvim/cvs",
                resource_type: "image",
                format: "pdf"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(req.file.buffer);
    });

    cvUrl = result.secure_url;
}

        const application = new Application({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            job: req.body.job,
            jobTitle: req.body.jobTitle,
            cv: cvUrl,
            applicantId: req.applicantId,
            jobId: req.body.jobId,
        });

        await application.save();

        await Activity.create({
            message: `${application.name} applied for ${application.jobTitle}.`,
        });

       await transporter({
    to: "pmax53725@gmail.com",
    subject: "New Job Application",
    html: `
        <p>A new application has been received.</p>

        <p><strong>Name:</strong> ${application.name}</p>
        <p><strong>Email:</strong> ${application.email}</p>
        <p><strong>Phone:</strong> ${application.phone}</p>
        <p><strong>Job:</strong> ${application.jobTitle}</p>
    `
});


  await transporter({
    to: application.email,
    subject: "Application Received",
    html: `
        <p>Dear ${application.name},</p>

        <p>Thank you for applying for the <strong>${application.jobTitle}</strong> position.</p>

        <p>We have successfully received your application and CV.</p>

        <p>Our recruitment team will review your application and contact you if you are shortlisted.</p>

        <p>Best regards,<br>
        Norvim</p>
    `
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

                await transporter({
    to: application.email,
    subject: "Congratulations! You have been Shortlisted",
    html: `
        <p>Dear ${application.name},</p>

        <p><strong>Congratulations!</strong></p>

        <p>
            We are pleased to inform you that you have been shortlisted
            for the <strong>${application.jobTitle}</strong> position.
        </p>

        <p>
            Our recruitment team will contact you soon with the next steps.
        </p>

        <p>Best regards,<br>
        Norvim</p>
    `
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

                await transporter({
    to: application.email,
    subject: "Update on your job application",
    html: `
        <p>Dear ${application.name},</p>

        <p>
            Thank you for taking the time to apply for the
            <strong>${application.jobTitle}</strong> position.
        </p>

        <p>
            After careful consideration, we regret to inform you that
            you have not been selected for this role.
        </p>

        <p>
            We appreciate your interest in our company and encourage you
            to apply for future opportunities.
        </p>

        <p>We wish you all the best.</p>

        <p>Norvim</p>
    `
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

        let logoUrl = null;

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "norvim/logos",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                uploadStream.end(req.file.buffer);
            });

            logoUrl = result.secure_url;
        }

        const job = new Job({
            title: req.body.title,
            company: req.body.company,
            category: req.body.category,
            location: req.body.location,
            salary: req.body.salary,
            description: req.body.description,
            logo: logoUrl,
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

                await transporter({
    to: application.email,
    subject: "Congratulations! You have been Shortlisted",
    html: `
        <p>Dear ${application.name},</p>

        <p><strong>Congratulations!</strong></p>

        <p>
            We are pleased to inform you that you have been shortlisted
            for the <strong>${application.jobTitle}</strong> position.
        </p>

        <p>
            Our recruitment team will contact you soon with the next steps.
        </p>

        <p>Best regards,<br>
        Norvim</p>
    `
});
            } catch (emailError) {

                console.log("SHORTLISTED EMAIL ERROR:", emailError);

            }

        }

        // Rejected email
        if (application.status === "Rejected") {

            try {

               await transporter({
    to: application.email,
    subject: "Update on your job application",
    html: `
        <p>Dear ${application.name},</p>

        <p>
            Thank you for taking the time to apply for the
            <strong>${application.jobTitle}</strong> position.
        </p>

        <p>
            After careful consideration, we regret to inform you that
            you have not been selected for this role.
        </p>

        <p>
            We appreciate your interest in our company and encourage you
            to apply for future opportunities.
        </p>

        <p>We wish you all the best.</p>

        <p>Norvim</p>
    `
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

        // Upload logo to Cloudinary
        let logoUrl = "";

        if (req.file) {
            const result = await new Promise((resolve, reject) => {

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "norvim/logos",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                uploadStream.end(req.file.buffer);

            });

            logoUrl = result.secure_url;
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
            logo: logoUrl,

            isVerified: false,
            verificationCode,
            verificationCodeExpires

        });

        await employer.save();

        await Activity.create({
            message: `${employer.companyName} registered as an employer.`
        });

        // Send verification email
        await transporter({
    to: email,
    subject: "Verify your Norvim employer account",
    html: `
        <p>Hello ${companyName},</p>

        <p>Your Norvim employer verification code is:</p>

        <h2>${verificationCode}</h2>

        <p>This code expires in 10 minutes.</p>

        <p>
            If you did not create this employer account, you can ignore this email.
        </p>

        <p>Thank you,<br>
        Norvim</p>
    `
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
            `https://norvim.onrender.com/employer-reset-password.html?token=${resetToken}`;

await transporter({
    to: employer.email,
    subject: "Employer Password Reset",
    html: `
        <p>Hello ${employer.companyName},</p>

        <p>You requested to reset your password.</p>

        <p>
            Click the link below:
        </p>

        <p>
            <a href="${resetLink}">Reset your password</a>
        </p>

        <p>This link expires in 15 minutes.</p>

        <p>If you did not request this, you can ignore this email.</p>
    `
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
        await transporter({
    to: email,
    subject: "Verify your Norvim account",
    html: `
        <p>Hello ${name},</p>

        <p>Your Norvim verification code is:</p>

        <h2>${verificationCode}</h2>

        <p>This code expires in 10 minutes.</p>

        <p>
            If you did not create this account, you can ignore this email.
        </p>

        <p>Thank you,<br>
        Norvim</p>
    `
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


        if (!applicant.isVerified) {
            return res.status(403).json({
                message: "Your account is not verified. Please verify your email to continue.",
                needsVerification: true,
                email: applicant.email
            });
        }

        const token = jwt.sign(
            { id: applicant._id, role: "applicant" },
            JWT_SECRET,
            { expiresIn: "7d" }
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
    `https://norvim.onrender.com/reset-password.html?token=${resetToken}`;

await transporter({
    to: applicant.email,
    subject: "Password Reset",
    html: `
        <p>Hello ${applicant.name},</p>

        <p>You requested to reset your password.</p>

        <p>Click the link below to reset it:</p>

        <p>
            <a href="${resetLink}">Reset your password</a>
        </p>

        <p>This link will expire in 15 minutes.</p>

        <p>If you did not request this, please ignore this email.</p>
    `
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

        // Upload new logo to Cloudinary
        if (req.file) {

            const result = await new Promise((resolve, reject) => {

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "norvim/logos",
                        resource_type: "image"
                    },
                    (error, result) => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }

                    }
                );

                uploadStream.end(req.file.buffer);

            });

            updateData.logo = result.secure_url;
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

           await transporter({
    to: application.email,
    subject: "Congratulations! You have been Shortlisted",
    html: `
        <p>Dear ${application.name},</p>

        <p><strong>Congratulations!</strong></p>

        <p>
            We are pleased to inform you that you have been shortlisted
            for the <strong>${application.jobTitle}</strong> position.
        </p>

        <p>
            Our recruitment team will contact you soon with the next steps.
        </p>

        <p>Best regards,<br>
        Norvim</p>
    `
});

        }

        if (application.status === "Rejected") {

           await transporter({
    to: application.email,
    subject: "Update on your job application",
    html: `
        <p>Dear ${application.name},</p>

        <p>
            Thank you for taking the time to apply for the
            <strong>${application.jobTitle}</strong> position.
        </p>

        <p>
            After careful consideration, we regret to inform you that
            you have not been selected.
        </p>

        <p>
            We appreciate your interest and wish you all the best.
        </p>

        <p>Norvim</p>
    `
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

        // Upload profile photo to Cloudinary
        if (req.file) {

            const result = await new Promise((resolve, reject) => {

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "norvim/profiles",
                        resource_type: "image"
                    },
                    (error, result) => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                uploadStream.end(req.file.buffer);

            });

            updateData.profilePhoto = result.secure_url;
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

        console.error(error);

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


app.use(express.static(path.join(__dirname, "public"), {
    maxAge: "1d",
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith(".js")) {
            res.setHeader("Cache-Control", "no-cache, must-revalidate");
        }
    }
}));

// Make uploads folder accessible
app.use("/uploads", express.static("uploads", {
    maxAge: "7d",
    etag: true,
    lastModified: true
}));


const PORT = process.env.PORT || 3000;



// ==================== LABOUR MARKETPLACE API ====================
// Full marketplace MVP: worker discovery, requests, matching and work lifecycle.

function normaliseCoords(value) {
    if (!value || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) return null;
    const lng = Number(value.coordinates[0]);
    const lat = Number(value.coordinates[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    return [lng, lat];
}

function buildLocation(body) {
    const location = body && typeof body === "object" ? body : {};
    const coordinates = normaliseCoords(location.coordinates || location);
    return {
        country: String(location.country || "Kenya").trim(),
        county: String(location.county || "").trim(),
        area: String(location.area || "").trim(),
        ...(coordinates ? { coordinates: { type: "Point", coordinates } } : {})
    };
}

async function cleanMarketplaceGeoData() {
    // Older marketplace documents may have a GeoJSON `type: Point` without
    // the required coordinate array. Remove that malformed field so the
    // 2dsphere indexes can be built safely.
    for (const Model of [WorkerProfile, LabourRequest]) {
        const docs = await Model.find({ $or: [{ "location.coordinates": { $exists: true } }, { "location.town": { $exists: true } }] }).select("_id location.coordinates location.town").lean();
        for (const doc of docs) {
            const coords = doc.location?.coordinates;
            const valid = coords && coords.type === "Point" && Array.isArray(coords.coordinates) && coords.coordinates.length === 2 &&
                Number.isFinite(Number(coords.coordinates[0])) && Number.isFinite(Number(coords.coordinates[1])) &&
                Number(coords.coordinates[0]) >= -180 && Number(coords.coordinates[0]) <= 180 &&
                Number(coords.coordinates[1]) >= -90 && Number(coords.coordinates[1]) <= 90;
            const update = {};
            if (!valid && coords !== undefined) update.$unset = { "location.coordinates": 1 };
            if (doc.location?.town) update.$unset = { ...(update.$unset || {}), "location.town": 1 };
            if (Object.keys(update).length) {
                await Model.updateOne({ _id: doc._id }, update);
                console.log(`Cleaned marketplace location fields in ${Model.modelName}: ${doc._id}`);
            }
        }
    }
    await WorkerProfile.createIndexes();
    await LabourRequest.createIndexes();
    await LabourBooking.createIndexes();
    await CancellationReport.createIndexes();
    await AccountTransaction.createIndexes();
    await PublicComment.createIndexes();
    await PremiumSubscription.createIndexes();
}


async function notifyApplicant(applicantId, message) {
    try {
        if (applicantId) await Notification.create({ applicantId, message });
    } catch (error) {
        console.error("Marketplace notification error:", error);
    }
}

async function applyCancellationFine(report) {
    const FINE_AMOUNT = 100;
    if (report.status === "fine_applied") throw new Error("This report has already been fined.");
    const applicant = await Applicant.findById(report.reportedApplicantId);
    if (!applicant) throw new Error("Responsible account not found.");

    const newBalance = Number(applicant.balance || 0) - FINE_AMOUNT;
    applicant.balance = newBalance;
    await applicant.save();

    const transaction = await AccountTransaction.create({
        applicantId: applicant._id,
        type: "cancellation_fine",
        amount: -FINE_AMOUNT,
        balanceAfter: newBalance,
        description: "Fixed KSh 100 cancellation fine",
        bookingId: report.bookingId,
        reportId: report._id
    });

    report.status = "fine_applied";
    report.fineAmount = FINE_AMOUNT;
    report.decidedAt = new Date();
    report.finedAt = new Date();
    await report.save();

    await notifyApplicant(applicant._id, `Cancellation Fine: You were found guilty in connection with the cancellation of your request. A fixed cancellation fine of KSh 100 has been applied to your Norvim account. Your balance is ${newBalance < 0 ? `negative by KSh ${Math.abs(newBalance).toLocaleString()}` : `KSh ${newBalance.toLocaleString()}`}.`);
    await Activity.create({ message: `A KSh 100 cancellation fine was applied to ${applicant.name || "an applicant"} for marketplace booking #${String(report.bookingId).slice(-6)}.` });
    return { applicant, transaction };
}

const PREMIUM_PRICES = { jobs: 100, marketplace: 100 };
const PREMIUM_BENEFITS = {
  jobs: ["Premium profile visibility", "Premium badge", "Priority presentation where applicable"],
  marketplace: ["Premium worker profile presentation", "Premium badge", "Priority presentation where applicable"]
};

function containsProblematicComment(text) {
  const lower = String(text || "").toLowerCase();
  const blocked = ["spam", "scam", "fuck", "bitch", "nigger", "whore", "kill yourself"];
  return blocked.some(word => lower.includes(word));
}

async function getApplicantPremium(applicantId, product) {
  const sub = await PremiumSubscription.findOne({ applicantId, product, status: "active", $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).sort({ expiresAt: -1 });
  return sub;
}

async function getEmployerPremium(employerId, product) {
  const sub = await PremiumSubscription.findOne({ employerId, product, status: "active", $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).sort({ expiresAt: -1 });
  return sub;
}

const DEFAULT_MARKETPLACE_CATEGORIES = [
    ["Electrician", "Electrical installation, repair and maintenance"],
    ["Plumber", "Plumbing installation and repair"],
    ["Mason", "Masonry and building work"],
    ["Carpenter", "Carpentry, furniture and woodwork"],
    ["Painter", "Painting and finishing work"],
    ["Welder", "Metal fabrication and welding"],
    ["Tiler", "Floor and wall tiling"],
    ["Cleaner", "Home, office and commercial cleaning"],
    ["Gardener", "Gardening and landscaping"],
    ["Mechanic", "Vehicle repair and maintenance"],
    ["Driver", "Driving and transport services"],
    ["Solar Installation", "Solar power installation and maintenance"],
    ["CCTV Installation", "CCTV and security camera installation"]
];

async function ensureMarketplaceCategories() {
    for (const [name, description] of DEFAULT_MARKETPLACE_CATEGORIES) {
        await ServiceCategory.updateOne(
            { name },
            { $setOnInsert: { name, description, isActive: true } },
            { upsert: true }
        );
    }
}

// Public: list active service categories.
app.get("/api/marketplace/categories", async (req, res) => {
    try {
        let categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 }).lean();
        // Self-heal an empty category collection so a fresh deployment does not
        // show a broken Marketplace while waiting for the startup seed.
        if (!categories.length) {
            await ensureMarketplaceCategories();
            categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 }).lean();
        }
        res.json(categories);
    } catch (error) {
        console.error("Marketplace categories error:", error);
        res.status(500).json({ message: "Failed to load service categories.", error: process.env.NODE_ENV === "production" ? undefined : error.message });
    }
});

// Public: discover active workers. Supports category, county/area and radius search.
app.get("/api/marketplace/workers", async (req, res) => {
    try {
        const filter = { isActive: true, "availability.status": "Available" };
        if (req.query.category) filter.services = req.query.category;
        if (req.query.county) filter["location.county"] = new RegExp(`^${String(req.query.county).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i");
        if (req.query.area) filter["location.area"] = new RegExp(String(req.query.area).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

        const lng = Number(req.query.lng);
        const lat = Number(req.query.lat);
        const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 25, 1), 500);
        if (!(Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90)) {
            return res.status(400).json({ message: "Your location is required to find nearby workers." });
        }
        if (Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            filter["location.coordinates"] = {
                $near: {
                    $geometry: { type: "Point", coordinates: [lng, lat] },
                    $maxDistance: radiusKm * 1000
                }
            };
        }

        const workers = await WorkerProfile.find(filter)
            .populate("applicantId", "name phone profilePhoto")
            .populate("services", "name description")
            .limit(50)
            .lean();

        res.json(workers);
    } catch (error) {
        console.error("Marketplace workers error:", error);
        res.status(500).json({ message: "Failed to find workers." });
    }
});

// Public: view one worker profile.
app.get("/api/marketplace/workers/:id", async (req, res) => {
    try {
        const profile = await WorkerProfile.findOne({ _id: req.params.id, isActive: true })
            .populate("applicantId", "name phone profilePhoto")
            .populate("services", "name description")
            .lean();
        if (!profile) return res.status(404).json({ message: "Worker not found." });
        if (profile.applicantId?.profilePhoto) profile.profilePhoto = profile.applicantId.profilePhoto;
        res.json(profile);
    } catch (error) {
        res.status(400).json({ message: "Invalid worker ID." });
    }
});

// Applicant: create or update marketplace worker profile.
app.get("/api/marketplace/worker-profile", verifyApplicant, async (req, res) => {
    try {
        const profile = await WorkerProfile.findOne({ applicantId: req.applicantId })
            .populate("services")
            .populate("applicantId", "name phone profilePhoto")
            .lean();
        if (!profile) return res.status(404).json({ message: "Worker profile not found." });
        if (profile.applicantId?.profilePhoto) profile.profilePhoto = profile.applicantId.profilePhoto;
        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to load worker profile." });
    }
});

app.post("/api/marketplace/worker-profile", verifyApplicant, async (req, res) => {
    try {
        if (await WorkerProfile.exists({ applicantId: req.applicantId })) {
            return res.status(409).json({ message: "Worker profile already exists." });
        }
        const applicant = await Applicant.findById(req.applicantId).lean();
        if (!applicant) return res.status(404).json({ message: "Applicant account not found." });

        const services = Array.isArray(req.body.services) ? req.body.services : [];
        const validServices = await ServiceCategory.countDocuments({ _id: { $in: services }, isActive: true });
        if (services.length && validServices !== services.length) return res.status(400).json({ message: "One or more selected services are invalid." });

        if (req.body.phone !== undefined) await Applicant.findByIdAndUpdate(req.applicantId, { phone: String(req.body.phone).trim() });

        const workerLocation = buildLocation(req.body.location);
        const workerCoords = workerLocation.coordinates?.coordinates;
        if (!Array.isArray(workerCoords) || workerCoords.length !== 2) {
            return res.status(400).json({ message: "Use your current location before creating a worker profile." });
        }

        const profile = await WorkerProfile.create({
            applicantId: req.applicantId,
            displayName: String(req.body.displayName || applicant.name || "").trim(),
            bio: req.body.bio,
            // Worker profiles use the applicant's Norvim profile photo automatically.
            profilePhoto: applicant.profilePhoto || undefined,
            services,
            skills: Array.isArray(req.body.skills) ? req.body.skills : [],
            experience: req.body.experience,
            location: workerLocation,
            availability: req.body.availability || undefined,
            pricing: req.body.pricing || undefined
        });
        await profile.populate("services");
        res.status(201).json({ message: "Worker profile created successfully.", profile });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || "Failed to create worker profile." });
    }
});

app.put("/api/marketplace/worker-profile", verifyApplicant, async (req, res) => {
    try {
        const updates = {};
        if (req.body.phone !== undefined) await Applicant.findByIdAndUpdate(req.applicantId, { phone: String(req.body.phone).trim() });
        ["displayName", "bio", "skills", "experience", "availability", "pricing", "isActive"].forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
        if (req.body.location !== undefined) updates.location = buildLocation(req.body.location);
        const applicant = await Applicant.findById(req.applicantId).select("profilePhoto").lean();
        if (!applicant) return res.status(404).json({ message: "Applicant account not found." });
        updates.profilePhoto = applicant.profilePhoto || null;
        if (req.body.services !== undefined) {
            if (!Array.isArray(req.body.services)) return res.status(400).json({ message: "Services must be an array." });
            const valid = await ServiceCategory.countDocuments({ _id: { $in: req.body.services }, isActive: true });
            if (valid !== req.body.services.length) return res.status(400).json({ message: "One or more selected services are invalid." });
            updates.services = req.body.services;
        }
        const profile = await WorkerProfile.findOneAndUpdate({ applicantId: req.applicantId }, { $set: updates }, { new: true, runValidators: true }).populate("services");
        if (!profile) return res.status(404).json({ message: "Worker profile not found." });
        res.json({ message: "Worker profile updated successfully.", profile });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || "Failed to update worker profile." });
    }
});

// Marketplace requests remain active for 30 days unless completed/cancelled/otherwise closed.
async function expireOldLabourRequests() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
        await LabourRequest.updateMany(
            { status: "pending", createdAt: { $lt: cutoff } },
            { $set: { status: "expired" } }
        );
    } catch (error) {
        console.error("Labour request expiry check failed:", error);
    }
}

// Applicant: create a labour request.
app.post("/api/marketplace/requests", verifyApplicant, async (req, res) => {
    try {
        if (!req.body.title || !req.body.description) {
            return res.status(400).json({ message: "Title and description are required." });
        }

        let requestedWorkerId = null;
        if (req.body.workerId) {
            const worker = await WorkerProfile.findOne({ _id: req.body.workerId, isActive: true });
            if (!worker) return res.status(400).json({ message: "Selected worker is unavailable." });
            requestedWorkerId = worker._id;
        }

        const requestLocation = buildLocation(req.body.location);
        const requestCoords = requestLocation.coordinates?.coordinates;
        if (!Array.isArray(requestCoords) || requestCoords.length !== 2) {
            return res.status(400).json({ message: "Use your current location before posting a labour request." });
        }

        const request = await LabourRequest.create({
            requesterId: req.applicantId,
            requestedWorkerId,
            title: String(req.body.title).trim(),
            description: String(req.body.description).trim(),
            location: requestLocation,
            budget: req.body.budget || undefined
        });
        await Activity.create({ message: `New marketplace labour request: ${request.title}` });
        res.status(201).json({ message: "Labour request posted successfully.", request });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || "Failed to post labour request." });
    }
});

// Worker: request an open labour job immediately. The worker's existing profile is attached.
app.post("/api/marketplace/requests/:id/request", verifyApplicant, async (req, res) => {
    try {
        const worker = await WorkerProfile.findOne({ applicantId: req.applicantId, isActive: true });
        if (!worker) return res.status(404).json({ message: "Create a worker profile first." });
        if (worker.availability?.status !== "Available") return res.status(400).json({ message: "Set your worker status to Available first." });
        const request = await LabourRequest.findOne({ _id: req.params.id, status: "pending" });
        if (!request) return res.status(404).json({ message: "This labour request is no longer available." });
        if (String(request.requesterId) === String(req.applicantId)) return res.status(400).json({ message: "You cannot request your own labour post." });
        if (request.interestedWorkerIds?.some(id => String(id) === String(worker._id))) return res.status(409).json({ message: "You have already requested this job." });
        await LabourRequest.updateOne({ _id: request._id, status: "pending" }, { $addToSet: { interestedWorkerIds: worker._id } });
        await notifyApplicant(request.requesterId, `A worker has requested your labour job: ${request.title}`);
        res.json({ message: "Job requested successfully.", requested: true });
    } catch (error) {
        console.error("Labour job request error:", error);
        res.status(400).json({ message: error.message || "Failed to request this job." });
    }
});

// Worker: cancel their request for an open labour job.
app.delete("/api/marketplace/requests/:id/request", verifyApplicant, async (req, res) => {
    try {
        const worker = await WorkerProfile.findOne({ applicantId: req.applicantId, isActive: true });
        if (!worker) return res.status(404).json({ message: "Worker profile not found." });
        const request = await LabourRequest.findOneAndUpdate(
            { _id: req.params.id, status: "pending", interestedWorkerIds: worker._id },
            { $pull: { interestedWorkerIds: worker._id } },
            { new: true }
        );
        if (!request) return res.status(404).json({ message: "Your job request was not found or is no longer open." });
        res.json({ message: "Job request cancelled.", requested: false });
    } catch (error) {
        res.status(400).json({ message: "Failed to cancel job request." });
    }
});

// Public marketplace: active labour requests. Exact requester identity/contact is not exposed.
app.get("/api/marketplace/requests", async (req, res) => {
    try {
        await expireOldLabourRequests();
        const filter = { status: "pending" };
        const lng = Number(req.query.lng);
        const lat = Number(req.query.lat);
        const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 25, 1), 500);
        if (!(Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90)) {
            return res.status(400).json({ message: "Your location is required to view nearby labour requests." });
        }
        if (Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            filter["location.coordinates"] = { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: radiusKm * 1000 } };
        }
        const requests = await LabourRequest.find(filter)
            .populate("serviceCategoryId", "name")
            .sort({ createdAt: -1 })
            .limit(50)
            .select("title description location.area location.county location.coordinates budget status createdAt")
            .lean();
        const toRad = value => value * Math.PI / 180;
        const distanceKm = (lng1, lat1, lng2, lat2) => {
            const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
            return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        const applicantToken = req.headers.authorization?.split(" ")[1];
        let currentWorkerId = null;
        if (applicantToken) {
            try {
                const decoded = jwt.verify(applicantToken, JWT_SECRET);
                const currentWorker = await WorkerProfile.findOne({ applicantId: decoded.id, isActive: true }).select("_id").lean();
                currentWorkerId = currentWorker?._id || null;
            } catch (_) {}
        }
        for (const request of requests) {
            request.requested = !!currentWorkerId && Array.isArray(request.interestedWorkerIds) && request.interestedWorkerIds.some(id => String(id) === String(currentWorkerId));
            delete request.interestedWorkerIds;
            const rc = request.location?.coordinates?.coordinates;
            const rLng = Number(rc?.[0]), rLat = Number(rc?.[1]);
            if (Number.isFinite(lng) && Number.isFinite(lat) && Number.isFinite(rLng) && Number.isFinite(rLat)) {
                request.distanceKm = Math.round(distanceKm(lng, lat, rLng, rLat) * 10) / 10;
            } else request.distanceKm = null;
            if (request.location?.coordinates) delete request.location.coordinates;
        }
        if (Number.isFinite(lng) && Number.isFinite(lat)) requests.sort((a,b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        res.json(requests);
    } catch (error) {
        console.error("Marketplace labour requests error:", error);
        res.status(500).json({ message: "Failed to load labour requests." });
    }
});

// Worker: check whether the logged-in worker has already requested a job.
app.get("/api/marketplace/requests/:id/request-status", verifyApplicant, async (req, res) => {
    try {
        const worker = await WorkerProfile.findOne({ applicantId: req.applicantId, isActive: true }).select("_id").lean();
        if (!worker) return res.json({ requested: false, hasProfile: false });
        const request = await LabourRequest.findOne({ _id: req.params.id, status: "pending", interestedWorkerIds: worker._id }).select("_id").lean();
        res.json({ requested: !!request, hasProfile: true });
    } catch (error) {
        res.status(400).json({ message: "Unable to check request status." });
    }
});

// Applicant: own labour requests.
app.get("/api/marketplace/my-requests", verifyApplicant, async (req, res) => {
    try {
        await expireOldLabourRequests();
        const requests = await LabourRequest.find({ requesterId: req.applicantId })
            .populate("serviceCategoryId", "name")
            .populate({ path: "workerId", populate: [{ path: "services", select: "name" }, { path: "applicantId", select: "name phone" }] })
            .populate({ path: "interestedWorkerIds", populate: [{ path: "services", select: "name" }, { path: "applicantId", select: "name phone profilePhoto" }] })
            .sort({ createdAt: -1 })
            .lean();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Failed to load your labour requests." });
    }
});

// Worker: nearby open requests matching one of their services.
app.get("/api/marketplace/worker-requests", verifyApplicant, async (req, res) => {
    try {
        await expireOldLabourRequests();
        const worker = await WorkerProfile.findOne({ applicantId: req.applicantId, isActive: true });
        if (!worker) return res.status(404).json({ message: "Create a worker profile first." });
        if (!worker.services.length) return res.json([]);

        const filter = { status: "pending", $or: [{ requestedWorkerId: null }, { requestedWorkerId: worker._id }] };
        const coords = worker.location?.coordinates?.coordinates;
        if (!(Array.isArray(coords) && coords.length === 2 && Number.isFinite(Number(coords[0])) && Number.isFinite(Number(coords[1])))) {
            return res.status(400).json({ message: "Your current location is required before nearby labour requests can be shown." });
        }
        if (Array.isArray(coords) && coords.length === 2) {
            filter["location.coordinates"] = {
                $near: {
                    $geometry: { type: "Point", coordinates: coords },
                    $maxDistance: (worker.availability?.serviceRadiusKm || 10) * 1000
                }
            };
        }
        const requests = await LabourRequest.find(filter)
            .populate("serviceCategoryId", "name")
            .populate("requesterId", "name phone profilePhoto")
            .select("title description location budget status createdAt requestedWorkerId interestedWorkerIds")
            .limit(50)
            .sort({ createdAt: -1 })
            .lean();

        // Distance is calculated automatically from the worker's saved GPS point
        // and each request's saved GPS point. It is never entered manually.
        const workerLng = Number(coords?.[0]);
        const workerLat = Number(coords?.[1]);
        const hasWorkerCoords = Number.isFinite(workerLng) && Number.isFinite(workerLat);
        const toRad = value => value * Math.PI / 180;
        const distanceKm = (lng1, lat1, lng2, lat2) => {
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
            return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        for (const request of requests) {
            const rc = request.location?.coordinates?.coordinates;
            const lng = Number(rc?.[0]);
            const lat = Number(rc?.[1]);
            if (hasWorkerCoords && Number.isFinite(lng) && Number.isFinite(lat)) {
                request.distanceKm = Math.round(distanceKm(workerLng, workerLat, lng, lat) * 10) / 10;
            } else {
                request.distanceKm = null;
            }
        }
        requests.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to load nearby labour requests." });
    }
});

// Worker: accept a pending request assigned atomically to this worker.
app.put("/api/marketplace/requests/:id/accept", verifyApplicant, async (req, res) => {
    try {
        const worker = await WorkerProfile.findOne({ applicantId: req.applicantId, isActive: true });
        if (!worker) return res.status(404).json({ message: "Worker profile not found." });
        if (worker.availability.status !== "Available") return res.status(400).json({ message: "Set your worker status to Available first." });

        const request = await LabourRequest.findOneAndUpdate(
            { _id: req.params.id, status: "pending", $or: [{ requestedWorkerId: null }, { requestedWorkerId: worker._id }] },
            { $set: { workerId: worker._id, status: "accepted" } },
            { new: true }
        );
        if (!request) return res.status(409).json({ message: "This request is no longer available." });

        const booking = await LabourBooking.create({ requestId: request._id, requesterId: request.requesterId, workerId: worker._id });
        await notifyApplicant(request.requesterId, "A worker has accepted your labour request.");
        res.json({ message: "Request accepted.", request, booking });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || "Failed to accept request." });
    }
});

// Worker: decline a request (it remains available to other workers).
app.put("/api/marketplace/requests/:id/decline", verifyApplicant, async (req, res) => {
    try {
        const worker = await WorkerProfile.findOne({ applicantId: req.applicantId, isActive: true });
        if (!worker) return res.status(404).json({ message: "Worker profile not found." });
        const request = await LabourRequest.findOne({ _id: req.params.id, status: "pending", $or: [{ requestedWorkerId: null }, { requestedWorkerId: worker._id }] });
        if (!request) return res.status(404).json({ message: "Request not found or already assigned." });
        res.json({ message: "Request declined for you." });
    } catch (error) {
        res.status(400).json({ message: "Invalid request ID." });
    }
});

// Worker/customer: advance a booking through its lifecycle, with ownership checks.

app.post("/api/marketplace/bookings/:id/pay", verifyApplicant, async (req, res) => {
  try {
    if (!paystackConfigured()) return res.status(503).json({ message: "Payments are not configured yet." });
    const booking = await LabourBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (String(booking.requesterId) !== String(req.applicantId)) return res.status(403).json({ message: "Only the customer can pay for this booking." });
    if (!["accepted", "in_progress"].includes(booking.status)) return res.status(400).json({ message: "This booking is not payable." });
    if (booking.paymentStatus === "paid") return res.status(409).json({ message: "This booking has already been paid." });
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) return res.status(400).json({ message: "Enter a valid agreed job amount." });
    const commissionPercent = Number(process.env.NORVIM_COMMISSION_PERCENT || 10);
    const commissionAmount = Math.round(amount * commissionPercent) / 100;
    const workerEarnings = Math.round((amount - commissionAmount) * 100) / 100;
    const applicant = await Applicant.findById(req.applicantId).select("name email phone");
    const reference = `norvim-job-${booking._id}-${Date.now()}`.toLowerCase();
    booking.agreedAmount = amount; booking.commissionPercent = commissionPercent; booking.commissionAmount = commissionAmount; booking.workerEarnings = workerEarnings; booking.paymentStatus = "pending"; booking.paymentReference = reference;
    await booking.save();
    const payment = await PaymentTransaction.create({ applicantId: applicant._id, type: "marketplace_payment", product: "booking", bookingId: booking._id, amount, reference, metadata: { commissionPercent, commissionAmount, workerEarnings } });
    const charge = await paystackRequest("/charge", "POST", { email: applicant.email, amount: Math.round(amount * 100), currency: "KES", mobile_money: { phone: normalizeKenyanPhone(applicant.phone), provider: "mpesa" }, reference, metadata: { norvimType: "marketplace_payment", bookingId: String(booking._id), applicantId: String(applicant._id) } });
    payment.providerResponse = charge.data || charge; await payment.save();
    res.json({ message: charge.data?.display_text || "Complete the M-PESA authorization on your phone.", reference, amount, commissionAmount, workerEarnings, status: charge.data?.status || "pending" });
  } catch (error) { res.status(400).json({ message: error.message || "Unable to start payment." }); }
});

app.put("/api/marketplace/bookings/:id/status", verifyApplicant, async (req, res) => {
    try {
        const allowed = ["in_progress", "completed", "cancelled"];
        const nextStatus = String(req.body.status || "");
        if (!allowed.includes(nextStatus)) return res.status(400).json({ message: "Invalid booking status." });

        const booking = await LabourBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found." });

        const worker = await WorkerProfile.findOne({ _id: booking.workerId, applicantId: req.applicantId });
        const isRequester = String(booking.requesterId) === String(req.applicantId);
        if (!worker && !isRequester) return res.status(403).json({ message: "You do not have access to this booking." });
        if (booking.status === "completed" || booking.status === "cancelled") return res.status(400).json({ message: `This booking is already ${booking.status}.` });
        if (nextStatus === "in_progress" && !worker) return res.status(403).json({ message: "Only the worker can start the work." });

        if (nextStatus === "cancelled") {
            const reason = String(req.body.cancellationReason || "").trim();
            if (reason.length < 5) return res.status(400).json({ message: "Please provide a cancellation reason (at least 5 characters)." });
            booking.cancellationReason = reason.slice(0, 500);
            booking.cancelledBy = req.applicantId;
            booking.cancelledAt = new Date();
            booking.status = "cancelled";
            await booking.save();
            await LabourRequest.findByIdAndUpdate(booking.requestId, { status: "cancelled" });
            const otherParty = worker ? booking.requesterId : (await WorkerProfile.findById(booking.workerId))?.applicantId;
            await notifyApplicant(otherParty, `Your labour booking was cancelled. Reason: ${booking.cancellationReason}`);
            return res.json({ message: "Booking cancelled and the reason has been recorded.", booking });
        }

        booking.status = nextStatus;
        if (nextStatus === "in_progress") {
            booking.startedAt = new Date();
            await LabourRequest.findByIdAndUpdate(booking.requestId, { status: "in_progress" });
        }
        if (nextStatus === "completed") {
            booking.completedAt = new Date();
            await LabourRequest.findByIdAndUpdate(booking.requestId, { status: "completed" });
        }
        await booking.save();
        const otherParty = worker ? booking.requesterId : (await WorkerProfile.findById(booking.workerId))?.applicantId;
        await notifyApplicant(otherParty, `Labour booking status changed to ${nextStatus.replace("_", " ")}.`);
        res.json({ message: "Booking status updated.", booking });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || "Failed to update booking." });
    }
});

// Report a cancelled booking. Only the party who did not cancel can report it.
app.post("/api/marketplace/bookings/:id/report-cancellation", verifyApplicant, async (req, res) => {
    try {
        const message = String(req.body.message || "").trim();
        if (message.length < 5) return res.status(400).json({ message: "Please explain why you are reporting this cancellation." });
        const booking = await LabourBooking.findById(req.params.id);
        if (!booking || booking.status !== "cancelled") return res.status(404).json({ message: "Cancelled booking not found." });
        if (String(booking.cancelledBy) === String(req.applicantId)) return res.status(403).json({ message: "The person who cancelled cannot report their own cancellation." });
        const existing = await CancellationReport.findOne({ bookingId: booking._id });
        if (existing) return res.status(409).json({ message: "This cancellation has already been reported." });
        const report = await CancellationReport.create({
            bookingId: booking._id, requestId: booking.requestId, reporterId: req.applicantId,
            reportedApplicantId: booking.cancelledBy, message: message.slice(0, 1500)
        });
        await Activity.create({ message: `A marketplace cancellation was reported for booking #${String(booking._id).slice(-6)}.` });
        res.status(201).json({ message: "Cancellation report submitted for review.", report });
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to submit cancellation report." });
    }
});

app.get("/api/marketplace/bookings/:id/cancellation-report", verifyApplicant, async (req, res) => {
    try {
        const booking = await LabourBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (String(booking.requesterId) !== String(req.applicantId) && String((await WorkerProfile.findById(booking.workerId))?.applicantId) !== String(req.applicantId)) return res.status(403).json({ message: "Not authorized." });
        const report = await CancellationReport.findOne({ bookingId: booking._id }).lean();
        res.json({ report });
    } catch (error) { res.status(500).json({ message: "Failed to load cancellation report." }); }
});

app.get("/api/marketplace/bookings", verifyApplicant, async (req, res) => {
    try {
        const worker = await WorkerProfile.findOne({ applicantId: req.applicantId });
        const workerIds = worker ? [worker._id] : [];
        const bookings = await LabourBooking.find({ $or: [{ requesterId: req.applicantId }, { workerId: { $in: workerIds } }] })
            .populate("requestId")
            .populate("workerId")
            .populate("requesterId", "name phone")
            .sort({ createdAt: -1 })
            .lean();
        const reportIds = bookings.map(b => b._id);
        const reports = reportIds.length ? await CancellationReport.find({ bookingId: { $in: reportIds } }).select("bookingId status fineAmount").lean() : [];
        const reportMap = new Map(reports.map(r => [String(r.bookingId), r]));
        for (const b of bookings) {
            b.cancelledByMe = String(b.cancelledBy || "") === String(req.applicantId);
            b.isRequester = String(b.requesterId?._id || b.requesterId || "") === String(req.applicantId);
            b.cancellationReport = reportMap.get(String(b._id)) || null;
        }
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Failed to load bookings." });
    }
});

// =============================================================
// Norvim homepage media (admin-managed; stored on Cloudinary)

app.get("/api/homepage-media", async (req, res) => {
  try {
    const media = await HomepageMedia.find({ status: "published" })
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .limit(30)
      .lean();
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: "Failed to load homepage media." });
  }
});

app.get("/api/admin/homepage-media", adminAuth, async (req, res) => {
  try {
    const media = await HomepageMedia.find({})
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .limit(500)
      .lean();
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: "Failed to load homepage media." });
  }
});

app.post("/api/admin/homepage-media", adminAuth, uploadHomepageMedia.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose a picture or video." });

    const isVideo = req.file.mimetype.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";
    const folder = "norvim/homepage";

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, uploaded) => error ? reject(error) : resolve(uploaded)
      );
      uploadStream.end(req.file.buffer);
    });

    const media = await HomepageMedia.create({
      type: isVideo ? "video" : "image",
      title: String(req.body.title || "").trim().slice(0, 160),
      caption: String(req.body.caption || "").trim().slice(0, 1000),
      url: result.secure_url,
      publicId: result.public_id,
      status: req.body.status === "hidden" ? "hidden" : "published",
      featured: String(req.body.featured) === "true",
      sortOrder: Number.isFinite(Number(req.body.sortOrder)) ? Number(req.body.sortOrder) : 0
    });

    await Activity.create({ message: `Homepage ${isVideo ? "video" : "image"} was added by an admin.` });
    res.status(201).json({ message: "Homepage media uploaded successfully.", media });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to upload homepage media." });
  }
});

app.put("/api/admin/homepage-media/:id", adminAuth, async (req, res) => {
  try {
    const update = {};
    if (req.body.title !== undefined) update.title = String(req.body.title).trim().slice(0, 160);
    if (req.body.caption !== undefined) update.caption = String(req.body.caption).trim().slice(0, 1000);
    if (["published", "hidden"].includes(req.body.status)) update.status = req.body.status;
    if (req.body.featured !== undefined) update.featured = Boolean(req.body.featured);
    if (req.body.sortOrder !== undefined && Number.isFinite(Number(req.body.sortOrder))) update.sortOrder = Number(req.body.sortOrder);

    const media = await HomepageMedia.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!media) return res.status(404).json({ message: "Homepage media not found." });
    await Activity.create({ message: `Homepage media ${media._id} was updated by an admin.` });
    res.json({ message: "Homepage media updated.", media });
  } catch (error) {
    res.status(400).json({ message: "Failed to update homepage media." });
  }
});

app.delete("/api/admin/homepage-media/:id", adminAuth, async (req, res) => {
  try {
    const media = await HomepageMedia.findById(req.params.id);
    if (!media) return res.status(404).json({ message: "Homepage media not found." });

    try {
      await cloudinary.uploader.destroy(media.publicId, { resource_type: media.type, invalidate: true });
    } catch (cloudError) {
      console.error("Cloudinary homepage media delete failed:", cloudError.message);
    }

    await media.deleteOne();
    await Activity.create({ message: `Homepage media ${media._id} was deleted by an admin.` });
    res.json({ message: "Homepage media deleted." });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete homepage media." });
  }
});

// =============================================================
// Norvim public comments, Premium and account wallet

app.get("/api/marketplace/comments", async (req, res) => {
  try {
    const comments = await PublicComment.find({ status: "approved" }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(comments);
  } catch (error) { res.status(500).json({ message: "Failed to load comments." }); }
});

app.post("/api/marketplace/comments", verifyApplicant, async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    if (message.length < 3) return res.status(400).json({ message: "Please write a comment." });
    const applicant = await Applicant.findById(req.applicantId).select("name");
    if (!applicant) return res.status(404).json({ message: "Account not found." });
    const flagged = containsProblematicComment(message);
    const comment = await PublicComment.create({ applicantId: applicant._id, name: applicant.name, message, status: flagged ? "pending" : "approved", flagged, moderationReason: flagged ? "Automatic moderation flag" : "" });
    res.status(201).json({ message: flagged ? "Your comment was sent for moderation." : "Your comment is now visible.", comment });
  } catch (error) { res.status(400).json({ message: error.message || "Failed to submit comment." }); }
});


// Live payment integration (Paystack: M-PESA in Kenya). The code is production-ready
// once PAYSTACK_SECRET_KEY and a verified Paystack business account are configured.
const PAYSTACK_BASE = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET_KEY;
const NORVIM_COMMISSION_PERCENT = Number(process.env.NORVIM_COMMISSION_PERCENT || 10);

function paystackConfigured() { return Boolean(PAYSTACK_SECRET_KEY); }
function normalizeKenyanPhone(phone) {
  const raw = String(phone || "").replace(/[^0-9+]/g, "");
  if (raw.startsWith("+254")) return raw;
  if (raw.startsWith("254")) return `+${raw}`;
  if (raw.startsWith("0") && raw.length === 10) return `+254${raw.slice(1)}`;
  return raw;
}
async function paystackRequest(pathname, method = "GET", body = undefined) {
  if (!paystackConfigured()) throw new Error("Live payment provider is not configured yet.");
  const response = await fetch(`${PAYSTACK_BASE}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status === false) throw new Error(data.message || "Payment provider request failed.");
  return data;
}
function verifyPaystackSignature(req) {
  if (!PAYSTACK_WEBHOOK_SECRET || !req.rawBody) return false;
  const expected = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET).update(req.rawBody).digest("hex");
  const received = String(req.headers["x-paystack-signature"] || "");
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
async function creditWalletFromPayment(payment) {
  if (!payment || payment.type !== "wallet_topup" || payment.status !== "success") return;
  const existing = await AccountTransaction.findOne({ paymentReference: payment.reference });
  if (existing) return;
  const applicant = await Applicant.findById(payment.applicantId);
  if (!applicant) return;
  const amount = Number(payment.amount || 0);
  if (amount <= 0) return;
  applicant.balance = Number(applicant.balance || 0) + amount;
  await applicant.save();
  await AccountTransaction.create({
    applicantId: applicant._id,
    type: "credit",
    amount,
    balanceAfter: applicant.balance,
    description: `Wallet top-up via M-PESA · ${payment.reference}`,
    paymentReference: payment.reference
  });
  await notifyApplicant(applicant._id, `Wallet top-up successful: KSh ${amount.toLocaleString()} has been added to your Norvim wallet.`);
}

async function activatePremiumFromPayment(payment) {
  if (!payment || payment.status === "success" && payment.type !== "premium") return;
  const product = payment.product;
  if (!product || !["jobs", "marketplace"].includes(product)) return;
  const existing = await PremiumSubscription.findOne({ applicantId: payment.applicantId, product, paymentReference: payment.reference });
  if (existing) return existing;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const sub = await PremiumSubscription.create({ applicantId: payment.applicantId, product, status: "active", amount: payment.amount, startsAt: new Date(), expiresAt, paymentReference: payment.reference });
  await notifyApplicant(payment.applicantId, `Norvim Premium: ${product === "jobs" ? "Jobs" : "Marketplace"} Premium is now active until ${expiresAt.toLocaleDateString()}.`);
  await Activity.create({ message: `Premium payment ${payment.reference} activated ${product} Premium.` });
  return sub;
}


async function payoutWorkerForBooking(booking) {
  if (!paystackConfigured() || !booking || booking.paymentStatus !== "paid" || booking.payoutStatus === "paid") return null;
  const workerProfile = await WorkerProfile.findById(booking.workerId).select("applicantId");
  if (!workerProfile) throw new Error("Worker profile not found.");
  const worker = await Applicant.findById(workerProfile.applicantId).select("name phone");
  if (!worker || !worker.phone) throw new Error("Worker payout phone number is missing.");
  const earnings = Number(booking.workerEarnings || 0);
  if (earnings <= 0) throw new Error("Worker earnings are not available for payout.");
  booking.payoutStatus = "pending";
  await booking.save();
  const recipient = await paystackRequest("/transferrecipient", "POST", {
    type: "mobile_money", name: worker.name, account_number: normalizeKenyanPhone(worker.phone).replace(/^\+/, ""), bank_code: "MPESA", currency: "KES"
  });
  const reference = `norvim-payout-${booking._id}-${Date.now()}`.toLowerCase();
  const transfer = await paystackRequest("/transfer", "POST", {
    source: "balance", amount: Math.round(earnings * 100), recipient: recipient.data.recipient_code,
    reason: `Norvim worker earnings for booking ${String(booking._id).slice(-8)}`, reference, currency: "KES"
  });
  booking.payoutReference = reference;
  booking.payoutStatus = transfer.data?.status === "success" ? "paid" : "pending";
  await booking.save();
  const payoutTx = await PaymentTransaction.create({ applicantId: worker._id, type: "payout", product: "booking", bookingId: booking._id, amount: earnings, reference, status: transfer.data?.status === "success" ? "payout_success" : "payout_pending", metadata: { recipientCode: recipient.data.recipient_code }, providerResponse: transfer.data || transfer });
  await AccountTransaction.create({ applicantId: worker._id, type: "payout", amount: 0, balanceAfter: Number(worker.balance || 0), description: `Worker earnings payout sent externally for booking #${String(booking._id).slice(-8)}`, bookingId: booking._id });
  await notifyApplicant(worker._id, `Norvim payout: KSh ${earnings.toLocaleString()} has been released to your registered M-PESA number for your completed labour booking.`);
  return payoutTx;
}

// Provider webhook. Never trust the browser to mark a payment successful.
app.post("/api/payments/paystack/webhook", async (req, res) => {
  try {
    if (!verifyPaystackSignature(req)) return res.status(401).send("Invalid signature");
    const event = req.body || {};
    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (reference) {
        const payment = await PaymentTransaction.findOne({ reference });
        if (payment && payment.status !== "success") {
          payment.status = "success";
          payment.providerResponse = event.data;
          await payment.save();
          if (payment.type === "premium") await activatePremiumFromPayment(payment);
          if (payment.type === "wallet_topup") await creditWalletFromPayment(payment);
          if (payment.type === "marketplace_payment" && payment.bookingId) {
            const booking = await LabourBooking.findById(payment.bookingId);
            if (booking) { booking.paymentStatus = "paid"; booking.paymentReference = payment.reference; await booking.save(); if (booking.status === "completed") { try { await payoutWorkerForBooking(booking); } catch (payoutError) { console.error("Worker payout pending:", payoutError.message); } } }
          }
        }
      }
    }
    if (event.event === "charge.failed") {
      const reference = event.data?.reference;
      if (reference) {
        const payment = await PaymentTransaction.findOne({ reference });
        if (payment && payment.status === "pending") {
          payment.status = "failed"; payment.providerResponse = event.data; await payment.save();
          if (payment.bookingId) await LabourBooking.findByIdAndUpdate(payment.bookingId, { paymentStatus: "failed" });
        }
      }
    }
    if (event.event === "transfer.success" || event.event === "transfer.failed" || event.event === "transfer.reversed") {
      const reference = event.data?.reference;
      const payment = reference ? await PaymentTransaction.findOne({ reference }) : null;
      if (payment) {
        payment.status = event.event === "transfer.success" ? "payout_success" : "payout_failed";
        payment.providerResponse = event.data;
        await payment.save();
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Paystack webhook error:", error.message);
    res.sendStatus(200);
  }
});


app.get("/api/payments/verify/:reference", verifyApplicant, async (req, res) => {
  try {
    const payment = await PaymentTransaction.findOne({ reference: req.params.reference, applicantId: req.applicantId }).lean();
    if (!payment) return res.status(404).json({ message: "Payment not found." });
    if (paystackConfigured() && payment.status === "pending") {
      try {
        const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(payment.reference)}`);
        if (result.data?.status === "success") {
          const updated = await PaymentTransaction.findOneAndUpdate({ _id: payment._id, status: { $ne: "success" } }, { $set: { status: "success", providerResponse: result.data } }, { new: true });
          if (updated?.type === "premium") await activatePremiumFromPayment(updated);
          if (updated?.type === "wallet_topup") await creditWalletFromPayment(updated);
          if (updated?.type === "marketplace_payment" && updated.bookingId) {
            const booking = await LabourBooking.findByIdAndUpdate(updated.bookingId, { paymentStatus: "paid", paymentReference: updated.reference }, { new: true });
            if (booking?.status === "completed") { try { await payoutWorkerForBooking(booking); } catch (e) { console.error("Worker payout pending:", e.message); } }
          }
        }
      } catch (_) {}
    }
    const fresh = await PaymentTransaction.findById(payment._id).lean();
    res.json({ reference: fresh.reference, status: fresh.status, amount: fresh.amount, type: fresh.type, product: fresh.product, bookingId: fresh.bookingId });
  } catch (error) { res.status(500).json({ message: "Unable to verify payment." }); }
});

app.post("/api/account/wallet/topup", verifyApplicant, async (req, res) => {
  try {
    if (!paystackConfigured()) return res.status(503).json({ message: "Payments are not configured yet. Add the live Paystack secret key after opening the business payment account." });
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 10 || amount > 100000) return res.status(400).json({ message: "Enter a wallet top-up between KSh 10 and KSh 100,000." });
    const applicant = await Applicant.findById(req.applicantId).select("name email phone");
    if (!applicant) return res.status(404).json({ message: "Account not found." });
    const reference = `norvim-wallet-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`.toLowerCase();
    const payment = await PaymentTransaction.create({ applicantId: applicant._id, type: "wallet_topup", amount, reference, metadata: { purpose: "wallet_topup" } });
    try {
      const charge = await paystackRequest("/charge", "POST", { email: applicant.email, amount: Math.round(amount * 100), currency: "KES", mobile_money: { phone: normalizeKenyanPhone(applicant.phone), provider: "mpesa" }, reference, metadata: { norvimType: "wallet_topup", applicantId: String(applicant._id) } });
      payment.providerResponse = charge.data || charge;
      await payment.save();
      res.json({ message: charge.data?.display_text || "Complete the M-PESA authorization on your phone.", reference, status: charge.data?.status || "pending", amount });
    } catch (providerError) {
      payment.status = "failed"; payment.providerResponse = { message: providerError.message }; await payment.save();
      throw providerError;
    }
  } catch (error) { res.status(400).json({ message: error.message || "Unable to start wallet top-up." }); }
});

app.post("/api/account/wallet/withdraw", verifyApplicant, async (req, res) => {
  try {
    if (!paystackConfigured()) return res.status(503).json({ message: "Withdrawals are not configured yet. Add the live Paystack secret key after opening the business payment account." });
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 10 || amount > 100000) return res.status(400).json({ message: "Enter a withdrawal between KSh 10 and KSh 100,000." });
    const applicant = await Applicant.findById(req.applicantId).select("name email phone balance");
    if (!applicant) return res.status(404).json({ message: "Account not found." });
    const balance = Number(applicant.balance || 0);
    if (balance < amount) return res.status(400).json({ message: `Insufficient available balance. Your current balance is KSh ${balance.toLocaleString()}.` });
    const pending = await PaymentTransaction.findOne({ applicantId: applicant._id, type: "payout", status: "payout_pending", "metadata.walletWithdrawal": true });
    if (pending) return res.status(409).json({ message: "You already have a withdrawal being processed. Please wait for it to complete." });
    const reference = `norvim-withdraw-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`.toLowerCase();
    const payment = await PaymentTransaction.create({ applicantId: applicant._id, type: "payout", product: "booking", amount, reference, status: "payout_pending", metadata: { walletWithdrawal: true, phone: normalizeKenyanPhone(applicant.phone) } });
    try {
      const recipient = await paystackRequest("/transferrecipient", "POST", {
        type: "mobile_money", name: applicant.name, account_number: normalizeKenyanPhone(applicant.phone).replace(/^\+/, ""), bank_code: "MPESA", currency: "KES"
      });
      const transfer = await paystackRequest("/transfer", "POST", {
        source: "balance", amount: Math.round(amount * 100), recipient: recipient.data.recipient_code,
        reason: `Norvim wallet withdrawal for ${applicant.name}`, reference, currency: "KES"
      });
      payment.providerResponse = transfer.data || transfer;
      payment.metadata = { ...(payment.metadata || {}), recipientCode: recipient.data.recipient_code };
      payment.status = transfer.data?.status === "success" ? "payout_success" : "payout_pending";
      await payment.save();
      if (payment.status === "payout_success") {
        applicant.balance = Number(applicant.balance || 0) - amount;
        await applicant.save();
        await AccountTransaction.create({ applicantId: applicant._id, type: "payout", amount: -amount, balanceAfter: applicant.balance, description: `Wallet withdrawal to M-PESA · ${reference}`, paymentReference: reference });
        await notifyApplicant(applicant._id, `Wallet withdrawal successful: KSh ${amount.toLocaleString()} was sent to your registered M-PESA number.`);
      }
      return res.json({ message: payment.status === "payout_success" ? "Withdrawal sent to your registered M-PESA number." : "Withdrawal submitted and is being processed.", reference, status: payment.status, amount });
    } catch (providerError) {
      payment.status = "payout_failed"; payment.providerResponse = { message: providerError.message }; await payment.save();
      throw providerError;
    }
  } catch (error) { res.status(400).json({ message: error.message || "Unable to process withdrawal." }); }
});

app.get("/api/account/summary", verifyApplicant, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.applicantId).select("name email balance").lean();
    const transactions = await AccountTransaction.find({ applicantId: req.applicantId }).sort({ createdAt: -1 }).limit(100).lean();
    const [jobsPremium, marketplacePremium] = await Promise.all([getApplicantPremium(req.applicantId, "jobs"), getApplicantPremium(req.applicantId, "marketplace")]);
    res.json({ applicant, balance: Number(applicant.balance || 0), transactions, premium: { jobs: jobsPremium, marketplace: marketplacePremium }, premiumPrices: PREMIUM_PRICES, premiumBenefits: PREMIUM_BENEFITS });
  } catch (error) { res.status(500).json({ message: "Failed to load account summary." }); }
});

app.get("/api/premium", verifyApplicant, async (req, res) => {
  try {
    const subscriptions = await PremiumSubscription.find({ applicantId: req.applicantId }).sort({ createdAt: -1 }).lean();
    res.json({ subscriptions, prices: PREMIUM_PRICES, benefits: PREMIUM_BENEFITS });
  } catch (error) { res.status(500).json({ message: "Failed to load Premium status." }); }
});

app.post("/api/premium/request", verifyApplicant, async (req, res) => {
  try {
    const product = String(req.body.product || "").trim();
    if (!["jobs", "marketplace"].includes(product)) return res.status(400).json({ message: "Choose Jobs or Marketplace Premium." });
    const applicant = await Applicant.findById(req.applicantId).select("name email phone");
    if (!applicant) return res.status(404).json({ message: "Account not found." });
    if (!paystackConfigured()) return res.status(503).json({ message: "Payments are not configured yet. Add the live Paystack secret key after opening the business payment account." });
    const reference = `norvim-premium-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`.toLowerCase();
    const amount = PREMIUM_PRICES[product];
    const payment = await PaymentTransaction.create({ applicantId: applicant._id, type: "premium", product, amount, reference, metadata: { product, applicantId: String(applicant._id) } });
    const charge = await paystackRequest("/charge", "POST", { email: applicant.email, amount: Math.round(amount * 100), currency: "KES", mobile_money: { phone: normalizeKenyanPhone(applicant.phone), provider: "mpesa" }, reference, metadata: { norvimType: "premium", product, applicantId: String(applicant._id) } });
    payment.providerResponse = charge.data || charge;
    await payment.save();
    res.json({ message: charge.data?.display_text || "Complete the M-PESA authorization on your phone.", reference, status: charge.data?.status || "pending", amount, product, benefits: PREMIUM_BENEFITS[product] });
  } catch (error) { res.status(400).json({ message: error.message || "Unable to start Premium payment." }); }
});

app.get("/api/admin/marketplace/comments", adminAuth, async (req, res) => {
  try { res.json(await PublicComment.find({}).populate("applicantId", "name email").sort({ createdAt: -1 }).limit(500).lean()); }
  catch (error) { res.status(500).json({ message: "Failed to load comments." }); }
});

app.put("/api/admin/marketplace/comments/:id", adminAuth, async (req, res) => {
  try {
    const status = String(req.body.status || "").trim();
    if (!["approved", "hidden", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid comment status." });
    const comment = await PublicComment.findByIdAndUpdate(req.params.id, { $set: { status, moderationReason: String(req.body.reason || "").trim().slice(0, 300) } }, { new: true });
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    await Activity.create({ message: `Marketplace public comment ${comment._id} was ${status}.` });
    res.json({ message: "Comment updated.", comment });
  } catch (error) { res.status(400).json({ message: "Failed to update comment." }); }
});

app.get("/api/admin/payments", adminAuth, async (req, res) => {
  try {
    const payments = await PaymentTransaction.find({}).populate("applicantId", "name email phone balance").sort({ createdAt: -1 }).limit(1000).lean();
    res.json(payments);
  } catch (error) { res.status(500).json({ message: "Failed to load payment records." }); }
});

app.post("/api/admin/payments/:id/refund", adminAuth, async (req, res) => {
  try {
    if (!paystackConfigured()) return res.status(503).json({ message: "Payments are not configured." });
    const payment = await PaymentTransaction.findById(req.params.id);
    if (!payment || payment.status !== "success" || payment.type === "payout") return res.status(400).json({ message: "Only successful customer payments can be refunded." });
    if (payment.status === "refunded") return res.status(409).json({ message: "Payment is already refunded." });
    const result = await paystackRequest("/refund", "POST", { transaction: payment.reference });
    payment.status = "refunded"; payment.providerResponse = result.data || result; await payment.save();
    if (payment.bookingId) await LabourBooking.findByIdAndUpdate(payment.bookingId, { paymentStatus: "refunded" });
    await Activity.create({ message: `Payment ${payment.reference} was refunded by an administrator.` });
    res.json({ message: "Refund submitted successfully.", payment });
  } catch (error) { res.status(400).json({ message: error.message || "Refund failed." }); }
});

app.get("/api/admin/premium", adminAuth, async (req, res) => {
  try { res.json(await PremiumSubscription.find({}).populate("applicantId", "name email balance").populate("employerId", "companyName email").sort({ createdAt: -1 }).limit(500).lean()); }
  catch (error) { res.status(500).json({ message: "Failed to load Premium subscriptions." }); }
});

app.post("/api/admin/premium/grant", adminAuth, async (req, res) => {
  try {
    const product = String(req.body.product || "").trim();
    const applicantId = req.body.applicantId || null;
    const employerId = req.body.employerId || null;
    if (!["jobs", "marketplace"].includes(product) || (!applicantId && !employerId) || (applicantId && employerId)) return res.status(400).json({ message: "Provide one account and a valid Premium product." });
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) return res.status(400).json({ message: "Invalid expiry date." });
    const sub = await PremiumSubscription.create({ applicantId, employerId, product, status: "active", amount: 0, expiresAt });
    if (applicantId) await notifyApplicant(applicantId, `Norvim Premium: ${product === "jobs" ? "Jobs" : "Marketplace"} Premium has been activated on your account.`);
    res.status(201).json({ message: "Premium activated.", subscription: sub });
  } catch (error) { res.status(400).json({ message: error.message || "Failed to grant Premium." }); }
});

app.put("/api/admin/premium/:id/status", adminAuth, async (req, res) => {
  try {
    const status = String(req.body.status || "").trim();
    if (!["active", "expired", "cancelled"].includes(status)) return res.status(400).json({ message: "Invalid Premium status." });
    const sub = await PremiumSubscription.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!sub) return res.status(404).json({ message: "Premium subscription not found." });
    if (sub.applicantId) await notifyApplicant(sub.applicantId, `Norvim Premium status: ${status}.`);
    res.json({ message: "Premium status updated.", subscription: sub });
  } catch (error) { res.status(400).json({ message: "Failed to update Premium." }); }
});

app.post("/api/admin/accounts/:id/adjust-balance", adminAuth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const description = String(req.body.description || "Admin account adjustment").trim().slice(0, 500);
    if (!Number.isFinite(amount) || amount === 0) return res.status(400).json({ message: "Enter a non-zero amount." });
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: "Applicant account not found." });
    applicant.balance = Number(applicant.balance || 0) + amount;
    await applicant.save();
    const tx = await AccountTransaction.create({ applicantId: applicant._id, type: amount > 0 ? "credit" : "debit", amount, balanceAfter: applicant.balance, description });
    await notifyApplicant(applicant._id, `Account balance updated by KSh ${amount.toLocaleString()}. New balance: KSh ${applicant.balance.toLocaleString()}.`);
    res.json({ message: "Balance updated.", balance: applicant.balance, transaction: tx });
  } catch (error) { res.status(400).json({ message: error.message || "Failed to adjust balance." }); }
});

// Admin: create categories.
app.post("/api/marketplace/categories", adminAuth, async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        if (!name) return res.status(400).json({ message: "Category name is required." });
        const category = await ServiceCategory.create({ name, description: String(req.body.description || "").trim() });
        res.status(201).json({ message: "Service category created successfully.", category });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "That service category already exists." });
        res.status(400).json({ message: error.message || "Failed to create service category." });
    }
});

// Admin: enable/disable a category.
app.put("/api/marketplace/categories/:id", adminAuth, async (req, res) => {
    try {
        const category = await ServiceCategory.findByIdAndUpdate(req.params.id, { $set: { isActive: Boolean(req.body.isActive) } }, { new: true, runValidators: true });
        if (!category) return res.status(404).json({ message: "Category not found." });
        res.json({ message: "Category updated.", category });
    } catch (error) {
        res.status(400).json({ message: "Invalid category ID." });
    }
});

// Admin marketplace management: overview, requests, workers and moderation.
app.get("/api/admin/marketplace/cancellation-reports", adminAuth, async (req, res) => {
    try {
        const reports = await CancellationReport.find({})
            .populate("bookingId")
            .populate("requestId", "title description")
            .populate("reporterId", "name email phone")
            .populate("reportedApplicantId", "name email phone balance")
            .sort({ createdAt: -1 }).limit(500).lean();
        res.json(reports);
    } catch (error) { res.status(500).json({ message: "Failed to load cancellation reports." }); }
});

app.put("/api/admin/marketplace/cancellation-reports/:id/decision", adminAuth, async (req, res) => {
    try {
        const decision = String(req.body.decision || "").trim();
        if (!["cleared", "guilty"].includes(decision)) return res.status(400).json({ message: "Choose cleared or guilty." });
        const report = await CancellationReport.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Cancellation report not found." });
        if (report.status === "fine_applied") return res.status(400).json({ message: "A fine has already been applied to this report." });
        report.status = decision;
        report.adminNote = String(req.body.adminNote || "").trim().slice(0, 1500);
        report.decidedAt = new Date();
        await report.save();
        const applicantMessage = decision === "guilty"
            ? "Your cancellation report has been decided and you were found guilty. A fixed KSh 100 cancellation fine is ready to be applied to your Norvim account."
            : "Your cancellation report has been decided and no cancellation fine has been applied.";
        await notifyApplicant(report.reportedApplicantId, applicantMessage);
        res.json({ message: `Report marked ${decision}.`, report });
    } catch (error) { res.status(400).json({ message: error.message || "Failed to decide cancellation report." }); }
});

app.post("/api/admin/marketplace/cancellation-reports/:id/fine", adminAuth, async (req, res) => {
    try {
        const report = await CancellationReport.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Cancellation report not found." });
        if (report.status !== "guilty") return res.status(400).json({ message: "Only a guilty report can receive a fine." });
        const result = await applyCancellationFine(report);
        res.json({ message: "KSh 100 fine applied successfully.", balance: result.applicant.balance, transaction: result.transaction });
    } catch (error) { res.status(400).json({ message: error.message || "Failed to apply fine." }); }
});

app.get("/api/admin/marketplace/summary", adminAuth, async (req, res) => {
    try {
        await expireOldLabourRequests();
        const [totalRequests, openRequests, inProgressRequests, completedRequests, expiredRequests, cancelledRequests, totalWorkers, activeWorkers, suspendedWorkers] = await Promise.all([
            LabourRequest.countDocuments({}),
            LabourRequest.countDocuments({ status: "pending" }),
            LabourRequest.countDocuments({ status: "in_progress" }),
            LabourRequest.countDocuments({ status: "completed" }),
            LabourRequest.countDocuments({ status: "expired" }),
            LabourRequest.countDocuments({ status: "cancelled" }),
            WorkerProfile.countDocuments({}),
            WorkerProfile.countDocuments({ isActive: true }),
            WorkerProfile.countDocuments({ isActive: false })
        ]);
        res.json({ totalRequests, openRequests, inProgressRequests, completedRequests, expiredRequests, cancelledRequests, totalWorkers, activeWorkers, suspendedWorkers });
    } catch (error) { res.status(500).json({ message: "Failed to load marketplace summary." }); }
});

app.get("/api/admin/marketplace/requests", adminAuth, async (req, res) => {
    try {
        await expireOldLabourRequests();
        const requests = await LabourRequest.find({})
            .populate("requesterId", "name email phone profilePhoto")
            .populate({ path: "workerId", populate: { path: "applicantId", select: "name phone email profilePhoto" } })
            .sort({ createdAt: -1 }).limit(500).lean();
        res.json(requests);
    } catch (error) { res.status(500).json({ message: "Failed to load marketplace requests." }); }
});

app.put("/api/admin/marketplace/requests/:id/status", adminAuth, async (req, res) => {
    try {
        const allowed = ["pending", "accepted", "in_progress", "completed", "cancelled", "expired"];
        const status = String(req.body.status || "").trim();
        if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid request status." });
        const request = await LabourRequest.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true, runValidators: true }).populate("requesterId", "name email phone");
        if (!request) return res.status(404).json({ message: "Labour request not found." });
        await Activity.create({ message: `Marketplace request #${String(request._id).slice(-6)} status changed to ${status.replace("_", " ")}.` });
        if (request.requesterId?._id) await notifyApplicant(request.requesterId._id, `Your labour request status is now ${status.replace("_", " ")}.`);
        res.json({ message: "Request status updated.", request });
    } catch (error) { res.status(400).json({ message: "Failed to update request status." }); }
});

app.delete("/api/admin/marketplace/requests/:id", adminAuth, async (req, res) => {
    try {
        const request = await LabourRequest.findByIdAndDelete(req.params.id);
        if (!request) return res.status(404).json({ message: "Labour request not found." });
        await Activity.create({ message: `Marketplace request #${String(request._id).slice(-6)} was deleted by an administrator.` });
        res.json({ message: "Labour request deleted." });
    } catch (error) { res.status(400).json({ message: "Failed to delete labour request." }); }
});

app.get("/api/admin/marketplace/workers", adminAuth, async (req, res) => {
    try {
        const workers = await WorkerProfile.find({})
            .populate("applicantId", "name email phone profilePhoto")
            .populate("services", "name")
            .sort({ createdAt: -1 }).limit(500).lean();
        res.json(workers);
    } catch (error) { res.status(500).json({ message: "Failed to load marketplace workers." }); }
});

app.put("/api/admin/marketplace/workers/:id/status", adminAuth, async (req, res) => {
    try {
        const isActive = Boolean(req.body.isActive);
        const worker = await WorkerProfile.findByIdAndUpdate(req.params.id, { $set: { isActive } }, { new: true, runValidators: true }).populate("applicantId", "name email phone");
        if (!worker) return res.status(404).json({ message: "Worker not found." });
        await Activity.create({ message: `Marketplace worker ${worker.applicantId?.name || "worker"} was ${isActive ? "reactivated" : "suspended"}.` });
        if (worker.applicantId?._id) await notifyApplicant(worker.applicantId._id, isActive ? "Your worker profile has been reactivated." : "Your worker profile has been suspended by an administrator.");
        res.json({ message: isActive ? "Worker reactivated." : "Worker suspended.", worker });
    } catch (error) { res.status(400).json({ message: "Failed to update worker status." }); }
});

// =============================================================

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log("MongoDB connected successfully");
    await ensureMarketplaceCategories();
    console.log("Marketplace service categories ready");
    await cleanMarketplaceGeoData();
    console.log("Marketplace geospatial indexes ready");
})
.catch((error) => {
    console.log("MongoDB connection error:", error);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

setInterval(expireOldLabourRequests, 60 * 60 * 1000);
