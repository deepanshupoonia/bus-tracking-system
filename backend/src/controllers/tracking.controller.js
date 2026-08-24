import * as tracking from '../services/tracking.service.js';
export async function listBuses(_request,response) { response.json({success:true,data:{buses:await tracking.busesForStudents()}}); }
export async function getBus(request,response) { response.json({success:true,data:{bus:await tracking.busDetails(request.params.id)}}); }
export async function getSchedule(request,response) { response.json({success:true,data:{schedule:await tracking.busSchedule(request.params.id)}}); }
