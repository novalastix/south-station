var sched_url = 'https://api-v3.mbta.com/predictions/?filter[stop]=place-sstat&sort=departure_time';
var trips_url = 'https://api-v3.mbta.com/trips?filter[id]='
var vehicle_url = 'https://api-v3.mbta.com/vehicles?filter[id]='
var tbodyID = 'tablebody';
var api_limit = 0

var schedule = [];
var usedtrips = {}

$.getJSON(sched_url, function(data) {

    var trip_ids = "";
    var train_ids = "";
    
    for(i=0;i<data.data.length && api_limit<20;i++){
        
        var departure_time = data.data[i].attributes.departure_time;

        if(departure_time!=null){
            if(api_limit > 20) break;
            var time = getTime(new Date(departure_time));
            var direction = data.data[i].attributes.direction_id;
            var status = data.data[i].attributes.status;
            var trip = data.data[i].relationships.trip.data.id;
            var carrier = (data.data[i].relationships.trip.data.id.substring(0,2) == "CR") ? "AMTRAK" : "MBTA";
            var train = data.data[i].relationships.vehicle.data?data.data[i].relationships.vehicle.data.id:null;
            train_ids += ","+train;
        
            var item = {"carrier":carrier,"time":time,"destination":null,"train":null,"status":status || "On time","meta":{"direction":direction,"train":train,"trip":trip}};

            if(usedtrips[trip] == null){
                usedtrips[trip] = true;
                trip_ids += ","+trip;
                schedule.push(item);
                api_limit++;
            }
            
        }
    }
    $.getJSON(trips_url+trip_ids.substring(1,trip_ids.length), function(trip_data) {
        for(i=0;i<schedule.length;i++){
            for(j=0;j<trip_data.data.length;j++){
                if(schedule[i].meta.trip==trip_data.data[j].id){
                    schedule[i].destination = trip_data.data[j].attributes.headsign;
                }
            }
        }
        $.getJSON(vehicle_url+train_ids.substring(1,train_ids.length), function(vehicle_data) {
            for(i=0;i<schedule.length;i++){
                for(j=0;j<vehicle_data.data.length;j++){
                    if(schedule[i].meta.train==vehicle_data.data[j].id){
                        schedule[i].train = vehicle_data.data[j].attributes.label;
                    }
                }
            }
            fillTable();
        });
    });
});

var date = new Date();
var weekdiv = document.getElementById("weekday");
var datediv = document.getElementById("date");
var timediv = document.getElementById("time");
const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
weekdiv.innerHTML = weekdays[date.getDay()];
timediv.innerHTML = getTime(date);
datediv.innerHTML = (date.getMonth()+1)+"-"+date.getDate()+"-"+date.getFullYear();

function fillTable(){
    let tbody = document.getElementById(tbodyID)
    for(i=0;i<schedule.length;i++){
        let row = document.createElement("tr");
        row.appendChild(generateCell(schedule[i].carrier));
        row.appendChild(generateCell(schedule[i].time));
        row.appendChild(generateCell(schedule[i].destination));
        row.appendChild(generateCell(schedule[i].train));
        row.appendChild(generateCell(schedule[i].status));

        tbody.appendChild(row);
    }
}

function generateCell(text){
    let td = document.createElement("td");
    td.appendChild(document.createTextNode((text||"").toUpperCase()));
    return td;
}

function getTime(d){
    return (d.getHours()%12==0?"12":d.getHours()%12) + ":" + ((d.getMinutes()<10?'0':'') + d.getMinutes()) + (d.getHours()>=12?" PM":" AM")
}