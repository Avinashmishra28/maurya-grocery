import express from "express";
import { cancleDelivery, completeDelivery, getMyDeliveries, getMyDeliveryDetail, loginPartner, updateDeliveryStatus, updateLocation } from "../controllers/deliveryPartnerController.js";
import deliveryAuth from "../middleware/deliveryAuth.js";


const deliveryPartnerRoute = express.Router();

deliveryPartnerRoute.post('/login', loginPartner)
deliveryPartnerRoute.get('/my-deliveries', deliveryAuth ,getMyDeliveries)
deliveryPartnerRoute.get('/my-deliveries/:id', deliveryAuth, getMyDeliveryDetail )
deliveryPartnerRoute.put('/my-deliveries/:id/complete', deliveryAuth,completeDelivery)
deliveryPartnerRoute.put('/my-deliveries/:id/cancel', deliveryAuth, cancleDelivery)
deliveryPartnerRoute.put('/my-deliveries/:id/status', deliveryAuth,updateDeliveryStatus)
deliveryPartnerRoute.put('/my-deliveries/:id/location', deliveryAuth, updateLocation)


export default deliveryPartnerRoute;