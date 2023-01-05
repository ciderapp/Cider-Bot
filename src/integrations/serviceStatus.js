import { firebase } from './firebase.js';
export const getServiceStatus = async () => {
    let res = await fetch(`https://www.apple.com/support/systemstatus/data/developer/system_status_en_US.js?callback=jsonCallback&_=${Date.now()}`);
    res = (await res.text()).split('jsonCallback(')[1].split(');')[0];
    res = JSON.parse(res);
    let toReturn = [];
    for (let service of res.services) {
        if (service.events.length > 0) {
            let cachedServiceEvents = await firebase.getServiceEvents(service.serviceName);
            for (let event of service.events) {
                if (cachedServiceEvents.length === 0) {
                    firebase.addServiceEvent(service.serviceName, event);
                    toReturn.push({ serviceName: service.serviceName, redirectUrl: service.redirectUrl, event: event});  
                } else {
                    for (let cachedEvent of cachedServiceEvents)
                        if (event.messageId === cachedEvent.messageId && event.eventStatus !== cachedEvent.eventStatus) {
                            firebase.addServiceEvent(service.serviceName, event);
                            cachedEvent.eventStatus = event.eventStatus;
                            toReturn.push({ serviceName: service.serviceName, redirectUrl: service.redirectUrl, event: event});   
                        }
                }
            }
            return toReturn;
        }
    }
};