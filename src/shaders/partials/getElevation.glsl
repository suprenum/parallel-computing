uniform float uElevation;
uniform float uElevationValleyFrequency;
uniform float uElevationValley;
uniform float uElevationGeneral;
uniform float uElevationGeneralFrequency;
uniform float uElevationDetails;
uniform float uElevationDetailsFrequency;

#pragma glslify: getPerlinNoise2d = require('../partials/getPerlinNoise2d.glsl')

float getElevation(vec2 _position)
{
    float elevation = 0.0;

    // General elevation
    elevation += getPerlinNoise2d(_position * uElevationGeneralFrequency) * uElevationGeneral;
    
    // Smaller details
    elevation += getPerlinNoise2d(_position * uElevationDetailsFrequency + 123.0) * uElevationDetails;

    elevation *= uElevation;

    return elevation;
}

#pragma glslify: export(getElevation)