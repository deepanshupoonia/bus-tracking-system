import * as tracking from '../services/tracking.service.js'; import { locationSchema } from '../validators/location.validator.js';
export async function current(request,response) { response.json({success:true,data:await tracking.driverSnapshot(request.user.sub)}); }
export async function start(request,response) { response.json({success:true,data:await tracking.startRoute(request.user.sub)}); }
export async function end(request,response) { response.json({success:true,data:await tracking.endRoute(request.user.sub)}); }
export async function location(request,response) { response.json({success:true,data:await tracking.updateLocation(request.user.sub,locationSchema.parse(request.body))}); }
