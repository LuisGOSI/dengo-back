import { Router } from "express";
import expo_controller from "../controllers/expo.controller";

const appRouter = Router();


appRouter.post('/expo/guardar-expo-token', expo_controller.guardarExpoToken);


export default appRouter;
