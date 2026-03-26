import { Account } from "../models/account.model.js";

// ✅ SET PIN
export const setPin = async (req, res) => {
    try {
        const { pin } = req.body;

        // 🔒 Validate PIN
        if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                message: "PIN must be exactly 4 digits"
            });
        }

        // ⚠️ include hidden field
        const account = await Account
            .findOne({ user: req.userId })
            .select("+transactionPin");

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        // ❗ now this works correctly
        if (account.transactionPin) {
            return res.status(400).json({
                message: "PIN already set. Use change PIN."
            });
        }

        // ✅ DO NOT HASH HERE (model will do it)
        account.transactionPin = pin;

        await account.save();

        return res.status(200).json({
            message: "Transaction PIN set successfully"
        });

    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};


// ✅ CHANGE PIN
export const changePin = async (req, res) => {
    try {
        const { oldPin, newPin } = req.body;

        // 🔒 Validate inputs
        if (!oldPin || typeof oldPin !== "string") {
            return res.status(400).json({
                message: "Old PIN is required"
            });
        }

        if (!newPin || typeof newPin !== "string" || !/^\d{4}$/.test(newPin)) {
            return res.status(400).json({
                message: "New PIN must be exactly 4 digits"
            });
        }

        if (oldPin === newPin) {
            return res.status(400).json({
                message: "New PIN cannot be same as old PIN"
            });
        }

        // ⚠️ include hidden field
        const account = await Account
            .findOne({ user: req.userId })
            .select("+transactionPin");

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        if (!account.transactionPin) {
            return res.status(400).json({
                message: "No PIN set yet"
            });
        }

        // 🔐 Compare old PIN
        const isMatch = await account.comparePin(oldPin);

        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect old PIN"
            });
        }

        // ✅ DO NOT HASH HERE
        account.transactionPin = newPin;

        await account.save();

        return res.status(200).json({
            message: "PIN changed successfully"
        });

    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};