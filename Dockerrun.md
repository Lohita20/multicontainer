## Notes on Dockerrun.aws.json

### essential

If the essental property is true, then the container must be running for all other containers in theh group to run. If an essential container crashes, all other containers will be shut down.

At least one container must have essential set to true.

### links

A container can only access another container if its name is included in the links property. For instance, the nginx container defines links to contain the client and server so it can route user traffic to them. The values in the links property are container names, not hostnames.

