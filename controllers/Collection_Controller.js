const CollectionModel = require("../models/Collection");

// ---------------------- Create Collection ----------------------
const CreateCollection = async (req, res) => {
  try {
    const {
      customer_name,
      loan_amount,
      per_day_collection,
      total_due_installment,
      day_for_loan,
      given_amount,
      refrence_by,
      mobile_no,
      adhar_card,
      pan_card,
    } = req.body;

    // Validation for required fields
    if (
      !customer_name ||
      !loan_amount ||
      !per_day_collection ||
      total_due_installment == null ||
      !day_for_loan ||
      !given_amount ||
      !refrence_by ||
      !mobile_no
    ) {
      return res.status(400).json({
        status: 400,
        message:
          "Required fields missing: customer_name, loan_amount, per_day_collection, total_due_installment, day_for_loan, given_amount, refrence_by, mobile_no",
      });
    }

    const newCollection = new CollectionModel({
      customer_name,
      loan_amount,
      per_day_collection,
      total_due_installment,
      day_for_loan,
      given_amount,
      refrence_by,
      mobile_no,
      adhar_card: adhar_card || null,
      pan_card: pan_card || null,
      total_paid_amount: 0,
      total_paid_installment: 0,
      remaining_balance: loan_amount,
      remaining_installments: total_due_installment,
      loan_status: total_due_installment === 0 ? "closed" : "open",
      installments: [],
    });

    await newCollection.save();

    return res.status(201).json({
      status: 201,
      message: "Loan collection record created successfully",
      data: newCollection,
    });
  } catch (error) {
    console.error("❌ CreateCollection Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error while creating collection record",
    });
  }
};

// ---------------------- Get All Collections (with filters) ----------------------
const GetCollectionsList = async (req, res) => {
  try {
    const { status, date, startDate, endDate } = req.query;

    let filter = {};

    // 1️⃣ Filter by loan_status
    if (status) {
      filter.loan_status = status; // "open" or "closed"
    }

    // 2️⃣ Filter by single date (createdAt)
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    // 3️⃣ Filter by date range (createdAt)
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const collections = await CollectionModel.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      status: 200,
      message: "Collections fetched successfully",
      data: collections,
    });
  } catch (error) {
    console.error("❌ GetCollectionsList Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error fetching collections",
    });
  }
};

// ---------------------- Update Collection Installment ----------------------
const UpdateCollectionInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const { installment_amount } = req.body;

    if (!installment_amount || installment_amount <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Installment amount must be greater than 0",
      });
    }

    const collection = await CollectionModel.findById(id);
    if (!collection) {
      return res
        .status(404)
        .json({ status: 404, message: "Collection not found" });
    }

    // Update totals
    collection.total_paid_amount += installment_amount;
    collection.total_paid_installment += 1;
    collection.remaining_balance =
      collection.loan_amount - collection.total_paid_amount;
    collection.remaining_installments =
      collection.total_due_installment - collection.total_paid_installment;

    // Add installment to history
    collection.installments.push({
      amount: installment_amount,
      date: new Date(),
    });

    // Close loan if fully paid or remaining installments is zero
    if (
      collection.remaining_balance <= 0 ||
      collection.remaining_installments <= 0
    ) {
      collection.loan_status = "closed";
      collection.remaining_balance = 0;
      collection.remaining_installments = 0;
    }

    await collection.save();

    res.status(200).json({
      status: 200,
      message: "Installment updated successfully",
      data: collection,
    });
  } catch (error) {
    console.error("❌ UpdateCollectionInstallment Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error while updating installment",
    });
  }
};

// ---------------------- Delete Collection ----------------------
const DeleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await CollectionModel.findById(id);
    if (!collection) {
      return res
        .status(404)
        .json({ status: 404, message: "Collection not found" });
    }

    await CollectionModel.findByIdAndDelete(id);

    res.status(200).json({
      status: 200,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("❌ DeleteCollection Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error while deleting collection",
    });
  }
};

// ---------------------- Update Collection Details ----------------------
const UpdateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const collection = await CollectionModel.findById(id);
    if (!collection) {
      return res.status(404).json({
        status: 404,
        message: "Collection not found",
      });
    }

    // ✅ Allowed fields for update (including new ones)
    const allowedFields = [
      "customer_name",
      "loan_amount",
      "given_amount",
      "refrence_by",
      "mobile_no",
      "per_day_collection",
      "total_due_installment",
      "day_for_loan",
      "adhar_card",
      "pan_card",
    ];

    // ✅ Update only the fields that are present in request body
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        collection[field] = updateData[field];
      }
    });

    // ✅ Recalculate remaining balance & installments if needed
    collection.remaining_balance =
      collection.loan_amount - collection.total_paid_amount;

    collection.remaining_installments =
      collection.total_due_installment - collection.total_paid_installment;

    collection.loan_status =
      collection.remaining_balance <= 0 ||
      collection.remaining_installments <= 0
        ? "closed"
        : "open";

    // ✅ Update "updatedAt" automatically handled by Mongoose timestamps

    await collection.save();

    return res.status(200).json({
      status: 200,
      message: "Collection updated successfully",
      data: collection,
    });
  } catch (error) {
    console.error("❌ UpdateCollection Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error while updating collection",
    });
  }
};

// ---------------------- Get Installment History ----------------------
const GetInstallmentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await CollectionModel.findById(id).select(
      "installments"
    );

    if (!collection) {
      return res
        .status(404)
        .json({ status: 404, message: "Collection not found" });
    }

    res.status(200).json({
      status: 200,
      message: "Installment history fetched successfully",
      data: collection.installments,
    });
  } catch (error) {
    console.error("❌ GetInstallmentHistory Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error fetching installment history",
    });
  }
};

// ---------------------- Dashboard Summary ----------------------
const GetDashboardSummary = async (req, res) => {
  try {
    // Get all collections
    const allCollections = await CollectionModel.find();

    const totalUsers = new Set(allCollections.map((c) => c.mobile_no)).size;
    const totalLoanAmount = allCollections.reduce(
      (sum, c) => sum + c.loan_amount,
      0
    );
    const totalPaidLoanAmount = allCollections.reduce(
      (sum, c) => sum + c.total_paid_amount,
      0
    );
    const totalDueLoanAmount = allCollections.reduce(
      (sum, c) => sum + c.remaining_balance,
      0
    );
    const totalOpenAccounts = allCollections.filter(
      (c) => c.loan_status === "open"
    ).length;
    const totalClosedAccounts = allCollections.filter(
      (c) => c.loan_status === "closed"
    ).length;

    return res.status(200).json({
      status: 200,
      message: "Dashboard summary fetched successfully",
      data: {
        totalUsers,
        totalLoanAmount,
        totalPaidLoanAmount,
        totalDueLoanAmount,
        totalOpenAccounts,
        totalClosedAccounts,
      },
    });
  } catch (error) {
    console.error("❌ GetDashboardSummary Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error while fetching dashboard summary",
    });
  }
};

// ---------------------- Yearly Loan Amount Chart ----------------------
const GetYearlyLoanAmountChart = async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    // Start and end of the year
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    // Aggregate total loan amount by month
    const result = await CollectionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalLoanAmount: { $sum: "$loan_amount" },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ]);

    // Convert to month names (Jan–Dec)
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Create full 12-month array
    const chartData = months.map((m, i) => {
      const found = result.find((r) => r._id.month === i + 1);
      return {
        month: m,
        totalLoanAmount: found ? found.totalLoanAmount : 0,
      };
    });

    res.status(200).json({
      status: 200,
      message: "Yearly loan amount chart data fetched successfully",
      data: chartData,
    });
  } catch (error) {
    console.error("❌ GetYearlyLoanAmountChart Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error fetching yearly loan amount chart data",
    });
  }
};

// ---------------------- Yearly Open/Close Chart ----------------------
const GetYearlyOpenCloseChart = async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    const result = await CollectionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            status: "$loan_status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const chartData = months.map((m, i) => {
      const openData = result.find(
        (r) => r._id.month === i + 1 && r._id.status === "open"
      );
      const closedData = result.find(
        (r) => r._id.month === i + 1 && r._id.status === "closed"
      );

      return {
        month: m,
        openCount: openData ? openData.count : 0,
        closedCount: closedData ? closedData.count : 0,
      };
    });

    res.status(200).json({
      status: 200,
      message: "Yearly open/close chart data fetched successfully",
      data: chartData,
    });
  } catch (error) {
    console.error("❌ GetYearlyOpenCloseChart Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error fetching open/close chart data",
    });
  }
};

module.exports = {
  CreateCollection,
  GetCollectionsList,
  UpdateCollectionInstallment,
  GetInstallmentHistory,
  DeleteCollection,
  UpdateCollection,
  GetDashboardSummary,
  GetYearlyLoanAmountChart,
  GetYearlyOpenCloseChart,
};
