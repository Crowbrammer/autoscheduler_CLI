# autoscheduler_CLI
Use Parkinson's Law by tightly scheduling activities more automatically. 

## Usage examples:

```
    a ct <name>                        -> Create a template. The first step.
    a ca <name> <duration>             -> Create an action which binds to the current template
    a ca <name> <duration> <position>  -> Create an action which binds to the current template at <position>
    a cs                               -> Create a schedule from the current template and associated actions
    a rs                               -> Retrieve the current schedule
    a rt                               -> Rerieve the current template with bound actions
    a ra                               -> Retrieve actions for the current template
    a ut <action-at> <move-to>         -> Move <action-at> to position of <move-to> and bump following actions
    a da <#>                           -> Deletes an action
```

Thank you for using this Autoscheduler!!
