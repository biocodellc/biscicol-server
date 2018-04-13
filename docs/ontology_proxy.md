# Ontology proxy service
Get information from ontology in a digestible format.  This service is useful in returning traits
to R functions and web services that want to learn about PPO traits without going through the work
of inspecting the ontology

## LONG FORM RESPONSES (traitID, Label, definition, URI)
```
# get all present trait classes
curl https://www.plantphenology.org/api/v2/ppo/present
# get all absent trait classes
curl https://www.plantphenology.org/api/v2/ppo/absent
# get all traits (both absent and present)
curl https://www.plantphenology.org/api/v2/ppo/all
```

## SHORT FORM RESPONSES (traitID and Label)
```
# get all present trait classes
curl https://www.plantphenology.org/api/v2/ppo/present_short
# get all absent trait classes
curl https://www.plantphenology.org/api/v2/ppo/absent_short
# get all traits (both absent and present)
curl https://www.plantphenology.org/api/v2/ppo/all_short
```
