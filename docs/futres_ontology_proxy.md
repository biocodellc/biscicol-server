# FOVT Ontology proxy service
Get information from ontology in a digestible format.  This service is useful in returning traits
to R functions and web services that want to learn about FOVT traits without going through the work
of inspecting the ontology

## LONG FORM RESPONSES (traitID, Label, definition, URI)
```
# get all classes under 1-d extent:
curl https://www.plantphenology.org/futresapi/v2/fovt
# get all classes in short form response (traitID and label)
curl https://www.plantphenology.org/futresapi/v2/fovt/all_short

```
