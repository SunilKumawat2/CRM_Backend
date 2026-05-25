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
const updateValetParking = async (req, res) => {
    try {
  
      const { id } = req.params;
  
      const updatedData = req.body;
  console.log("updatedData_updatedData",updatedData)
      const updatedParking =
        await ValetParking.findByIdAndUpdate(
          id,
          updatedData,
          { new: true }
        );
  
      if (!updatedParking) {
        return res.status(404).json({
          status: 404,
          message: "Parking record not found",
        });
      }
  
      return res.status(200).json({
        status: 200,
        message: "Valet parking updated successfully",
        data: updatedParking,
      });
  
    } catch (error) {
  
      console.error("Update Error", error);
  
      return res.status(500).json({
        status: 500,
        message: "Server Side Error",
      });
    }
  };

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
    updateValetParking,
    deleteParkingSlip
}