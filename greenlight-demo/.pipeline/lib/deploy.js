"use strict";
const { OpenShiftClientX } = require("pipeline-cli");
const path = require("path");

module.exports = settings => {
  const phases = settings.phases;
  const options = settings.options;
  const phase = options.env;
  const changeId = phases[phase].changeId;
  const oc = new OpenShiftClientX(Object.assign({ namespace: phases[phase].namespace }, options));
  const templatesLocalBaseUrl = oc.toFileUrl(path.resolve(__dirname, "../../../openshift"));
  var objects = [];

  objects.push(
    ...oc.processDeploymentTemplate(`${templatesLocalBaseUrl}/templates/greenlight/greenlight-deploy.json`, {
      param: {
        NAME: phases[phase].name,
        SUFFIX: phases[phase].suffix,
        VERSION: phases[phase].tag,
        APPLICATION_DOMAIN: `${phases[phase].name}${phases[phase].suffix}-${phases[phase].namespace}.pathfinder.gov.bc.ca`,
        APP_GROUP: phases[phase].phase,
        IMAGE_NAMESPACE: "devex-bcgov-dap-tools",
        TAG_NAME: phases[phase].tag,
        TOB_API_URL: "https://dev-demo.orgbook.gov.bc.ca/api",
        TOB_APP_URL: "https://dev-demo.orgbook.gov.bc.ca",
        WEB_HOST_NAME: "0.0.0.0",
        WEB_HOST_PORT: "8080",
        WEB_HOST_TLS: "off",
        WEB_BASE_HREF: "/",
        MINISTRY_AGRICULTURE_AGENT_HOST: "ministry-of-agriculture" + phases[phase].suffix,
        MINISTRY_AGRICULTURE_AGENT_PORT: "8080",
        BCREG_AGENT_HOST: "bc-registries" + phases[phase].suffix,
        BCREG_AGENT_PORT: "8080",
        MINISTRY_FINANCE_AGENT_HOST: "ministry-of-finance" + phases[phase].suffix,
        MINISTRY_FINANCE_AGENT_PORT: "8080",
        CITY_SURREY_AGENT_HOST: "city-of-surrey" + phases[phase].suffix,
        CITY_SURREY_AGENT_PORT: "8080",
        FRASER_VALLEY_AGENT_HOST: "fraser-valley-health-authority" + phases[phase].suffix,
        FRASER_VALLEY_AGENT_PORT: "8080",
        LIQUOR_CONTROL_AGENT_HOST: "liquor-control-and-licensing-branch" + phases[phase].suffix,
        LIQUOR_CONTROL_AGENT_PORT: "8080",
        WORKSAFE_AGENT_HOST: "worksafe-bc" + phases[phase].suffix,
        WORKSAFE_AGENT_PORT: "8080",
        CONFIG_FILE_NAME: "Caddyfile",
        CONFIG_MAP_NAME: "caddy-conf",
        CONFIG_MOUNT_PATH: "/etc/",
        CPU_LIMIT: "250m",
        MEMORY_LIMIT: "256Mi",
        CPU_REQUEST: "10m",
        MEMORY_REQUEST: "128Mi"
      }
    })
  );

  oc.applyRecommendedLabels(objects, phases[phase].name, phase, `${changeId}`, phases[phase].instance);
  oc.importImageStreams(objects, phases[phase].tag, phases.build.namespace, phases.build.tag);
  oc.applyAndDeploy(objects, phases[phase].instance);
};
