// routeMemoryToSoulprint.js
// Map ritual memory events to soulprint trait updates

function routeMemoryToSoulprint(memoryPayload) {
    const traitDeltas = {};

    if (memoryPayload.traits_detected) {
        for (const trait in memoryPayload.traits_detected) {
            if (memoryPayload.traits_detected[trait]) {
                traitDeltas[trait] = (traitDeltas[trait] || 0) + 1;
            }
        }
    }

    return traitDeltas;
}

export default routeMemoryToSoulprint;
