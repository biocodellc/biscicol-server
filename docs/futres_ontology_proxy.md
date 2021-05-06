# FOVT Ontology proxy service
Get information from ontology in a digestible format.  This service is useful in returning traits
to R functions and web services that want to learn about FOVT traits without going through the work
of inspecting the ontology

ontology lookup links with definitions, termid, uri, and label
 * https://www.plantphenology.org/futresapi/v2/fovt
 
## EXAMPLE RESPONSES (traitID, Label, definition, URI)
```
# get all classes under 1-d extent:
curl https://www.plantphenology.org/futresapi/v2/fovt
# get all classes in short form response (showing just traitID and label)
curl https://www.plantphenology.org/futresapi/v2/fovt/all_short

```
