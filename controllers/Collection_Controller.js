const CollectionModel = require("../models/Collection");

// ---------------------- Create Collection ----------------------
const CreateCollection = async (req, res) => {
  try {
    const { customer_name, loan_amount, per_day_collection, total_due_installment, day_for_loan } = req.body;

    if (!customer_name || !loan_amount || !per_day_collection || total_due_installment == null || !day_for_loan) {
      return res.status(400).json({
        status: 400,
        message: "Required fields missing: customer_name, loan_amount, per_day_collection, total_due_installment, day_for_loan",
      });
    }

    const newCollection = new CollectionModel({
      customer_name,
      loan_amount,
      per_day_collection,
      total_due_installment,
      day_for_loan,
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

// ---------------------- Get All Collections ----------------------
// ---------------------- Get All Collections (Paginated) ----------------------
const GetCollectionsList = async (req, res) => {
  try {
    // Parse query params with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip
    const skip = (page - 1) * limit;

    // Fetch paginated data
    const collections = await CollectionModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await CollectionModel.countDocuments();

    res.status(200).json({
      status: 200,
      message: "Collections fetched successfully",
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
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
      return res.status(404).json({ status: 404, message: "Collection not found" });
    }

    // Update totals
    collection.total_paid_amount += installment_amount;
    collection.total_paid_installment += 1;
    collection.remaining_balance = collection.loan_amount - collection.total_paid_amount;
    collection.remaining_installments = collection.total_due_installment - collection.total_paid_installment;

    // Add installment to history
    collection.installments.push({
      amount: installment_amount,
      date: new Date(),
    });

    // Close loan if fully paid or remaining installments is zero
    if (collection.remaining_balance <= 0 || collection.remaining_installments <= 0) {
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

// ---------------------- Get Installment History ----------------------
const GetInstallmentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await CollectionModel.findById(id).select("installments");

    if (!collection) {
      return res.status(404).json({ status: 404, message: "Collection not found" });
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

module.exports = {
  CreateCollection,
  GetCollectionsList,
  UpdateCollectionInstallment,
  GetInstallmentHistory,
};
