theme: /

state: entry
    q!: *
    
    script:
        log('entryPoint: ' + JSON.stringify($context))
        
    goto: Main

