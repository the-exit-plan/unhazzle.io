# feedback (25th October 2025)

**Mahya**

---

**Mahya**: Password - ability to show it is not good, I’m not sure what’s the purpose of this. 

**Me**: it’s supposed to detect a key of env var or secret from the image, then you can set it here. 

**Mahya**: still I prefer to set it one time and after that not be able to see it in the dashboard. probably you wanna preserve the ability to manipulate secrets but to me this can be a security risk. 

**Mahya**: Prevention for junior developers are missing! for example if my junior developer sit behind this and not sure what to choose for database, is there a possibility to put some sort of guardrail for him/her to not provision a database ? do you wanna think about that in your product ? I know after deployment if they don’t need it they can go and delete it, but I prefer prevention and shift to left in this situation. 

What’s your stance on logs and metrics ? Do you wanna provide proper logs and metrics ? if yes then logs should show for example connection to downstreams, ports, protocols, dbs, cache or whatever I have, incoming requests, outgoing. failure and success in logs - maybe best to ask ? also what about sensitive data in logs ? currently looks like you’re not clear on what to do about it.

**Me**: I’m not sure if we wanna do that, since that’s a whole product by itself, I don’t think if we want to become next datadog, or newrelic, maybe we want to show only infra logs here.

**Mahya**: Infra logs are also not present! what you have as logs here, doesn’t tell me anything. I understand it’s a demo, but as a senior developer and lead, first thing we think about is our tools for when things go wrong. 

And for Metrics,  jvm for example is infra related and should be there.

Alerting is missing as well, even if you’re gonna focus on infra related logs and metrics and you say Unhazzle is responsible for ensuring infra related availability, I still wanna get notified if something in your infra is broken, then I know it’s not our app.

Settings tab is misguiding, settings here doesn’t allow me to check my current config immediately also I need to know where are you giving permissions ? for example where can I define different permissions for the team and also different permissions for Unhazzle. it’s a bit vague what’s the purpose of settings tab here. Current config is not visible, maybe I get alert I want to come and check what’s the current app and setting that someone in my team deployed, and I can’t see that quickly. Also env is missing from the whole config and also the in toggles, for example it says “autoscaling” and I can turn it off, but I need to know if I’m turning this off in dev, or prod. also if I turn it off, I should be able to edit the number of replicas or cpu/ram adjustment in place, which is not possible. 

**Mahya’s** final verdict: it is really good and if you can solve these challenges, I think you have something cool here and it will actually make my life easier if I want to just focus on the code. I liked that it takes care of backups, autoscales, and all infra headaches. most of it is on the right track, but again I’ve dealt with so many incidents and I think of worst case scenarios immediately when I’m checking a product like this, also you need to provide migration tools/ways too, if I’m considering this platform as a startup developer even, I still have some my code running on somewhere probably with my pipelines setup, but I assume you already thought about that. 

**Inaki**

---

**Inaki**: On configuration page, what’s the situation on DB and Cache? are these managed by you? I don’t have to do anything? 

**Me**: that’s correct. 

**Inaki**: you sure? that’s like a big thing to do to offer all of the flavors as managed DB services.

**Me**: we’re still not sure, but there’s a good chance we parter with managed DB provider, like Aiven to take care of this part. for cache we haven’t decided yet. 

**Inaki**: ok, now what if I don’t find the db I need? for example if I want Cassandra and you don’t have it, I think you also need to provide a way for me to deploy my Cassandra to Unhazzle with my own responsibility, so I manage it myself. I want to be able to run cassandra as a container on your platform or if I want to use a third party for that in case you’re not covering it, I need to be able to provide a private endpoint so the connection don’t go to internet, and I don’t see anywhere to set this up.

BUG: Chose memcached but it says deploying redis! I hope in your actual product you care about my choices 😛

**Me**: 👀 😅

**Inaki**: Application monitoring is missing. I want to monitor the application and not just the container. application as a whole. current metrics are limited, even if you want to provide low level metrics, for instance I want to see conversion rate of my app and by that I mean what percentage of the incoming/outgoing request end up in a given status, for example 90% end up in 200, 9% 201, and 1% in 500. latency of app, my jar is slow or failing, basically the golden signals is the least I want to see, golden signal can be different per type of app, but I guess that would be the feature that separate you from the rest.

**Inaki**: If you’re not gonna provide the metrics I want or a limited set, then in configuration would be best to have prometheus, grafana, or OpenTelemetry configuration so I can configure it myself so I see/use that later somewhere in the dashboard or give a private endpoint. 

**Inaki**: In general I’m missing the ability to configure extra managed services if you don’t provide, like secure connections to another service. 

**Inaki**: Files to be available for the app, there is no way to configure it in unhazzle. for example in my docker compose I may copy some file from my local or in my repo from my repo, right now there’s no way to use those. either let the user upload them or accept github url to download it and attach volume to it. I assume for pipelines you have a separate solution to take care of these too.

**Inaki** final verdict: In general I really like it, it is pretty intuitive and with one glance I can see how to do what and I really like it. I also like the concept of speeding devs up with this idea. I think it can be even way better with the feedback I gave incorporated or at least guide me how to do them.