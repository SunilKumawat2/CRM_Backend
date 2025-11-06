const ValetParking = require("../models/ValetParking");

// <---------- Create parking slip ------------>
const createParkingSlip = async (req, res) => {
    try {
        const {
            guestName,
            roomNumber,
            vehicleNumber,
            vehicleBrand,
            vehicleModel,
            color,
            parkingSlot,
            slipNumber,
            notes
        } = req.body;

        if (!guestName || !vehicleNumber || !slipNumber) {
            return res.status(400).json({
                status: 400,
                message: "guestName, vehicleNumber & slipNumber are required"
            });
        }

        const slip = await ValetParking.create({
            guestName,
            roomNumber,
            vehicleNumber,
            vehicleBrand,
            vehicleModel,
            color,
            parkingSlot,
            slipNumber,
            notes,
            createdBy: req.adminId
        });

        return res.status(201).json({
            status: 201,
            message: "Parking slip created successfully",
            data: slip
        });

    } catch (err) {
        console.error("Create Parking Slip Error:", err);
        return res.status(500).json({ status: 500, message: "Server error creating parking slip" });
    }
};

// <-------- get valet parking slip ------------->
const getParkingSlips = async (req, res) => {
    try {
        const slips = await ValetParking.find().sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            message: "Parking slips fetched successfully",
            data: slips
        });
    } catch (error) {
        console.error("Get Parking Slips Error:", err)
        return res.status(500).json({ status: 500, message: "Server error fetching slips" })
    }
}

// <-------- Update valet Parking Slip --------------->
const updateParkingStatus  = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const slip = await ValetParking.findById(id);
        if (!slip) return res.status(400).json({ status: 400, message: "Slip not found" })

        if (status === "Requested") slip.requestedAt = new Date();
        if (status === "Delivered") slip.deliveredAt = new Date();

        slip.status = status;
        await slip.save();

        return res.status(201).json({ status: 201, message: "Parking status updated", data: slip })
    }
    catch (error) {
        console.error("server side error", error)
        return res.status(500).json({ status: 500, message: "Server Side error" })
    }
}

// <---------- Delete slip ---------------->
const deleteParkingSlip = async (req, res) => {
    try {
      const { id } = req.params;
  
      const slip = await ValetParking.findByIdAndDelete(id);
      if (!slip) return res.status(404).json({ status: 404, message: "Slip not found" });
  
      return res.status(200).json({ status: 200, message: "Parking slip deleted" });
    } catch (err) {
      console.error("Delete Slip Error:", err);
      return res.status(500).json({ status: 500, message: "Server error deleting slip" });
    }
  };

module.exports = {
    createParkingSlip,
    getParkingSlips,
    updateParkingStatus,
    deleteParkingSlip
}