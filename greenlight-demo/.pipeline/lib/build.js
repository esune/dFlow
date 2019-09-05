'use strict';
const {
  OpenShiftClientX
} = require('pipeline-cli')
const path = require('path');

module.exports = (settings) => {
  const phases = settings.phases
  const options = settings.options
  const oc = new OpenShiftClientX(Object.assign({
    'namespace': phases.build.namespace
  }, options));
  const phase = 'build'
  let objects = []
  const templatesLocalBaseUrl = oc.toFileUrl(path.resolve(__dirname, '../../../openshift/'))

  // caddy runtime build
  objects.push(...oc.processDeploymentTemplate(`${templatesLocalBaseUrl}/templates/caddy-runtime/caddy-runtime-build.json`, {
    'param': {
      'NAME': 'caddy-runtime' + phases[phase].suffix,
      'GIT_REPO_URL': oc.git.http_url,
      'GIT_REF': oc.git.ref,
      'SOURCE_CONTEXT_DIR': '',
      'OUTPUT_IMAGE_TAG': 'latest',
      'SOURCE_IMAGE_KIND': 'ImageStreamTag',
      'SOURCE_IMAGE_NAME': 'bcgov-s2i-caddy',
      'SOURCE_IMAGE_NAMESPACE': 'openshift',
      'SOURCE_IMAGE_TAG': 'latest',
      'DOCKER_FILE_PATH': 'docker/proxy/Dockerfile'
    }
  }));

  // angular app build
  objects.push(...oc.processDeploymentTemplate(`${templatesLocalBaseUrl}/templates/greenlight-angular/greenlight-angular-build.json`, {
    'param': {
      'NAME': 'greenlight-angular' + phases[phase].suffix,
      'GIT_REPO_URL': oc.git.http_url,
      'GIT_REF': oc.git.ref,
      'OUTPUT_IMAGE_TAG': 'latest',
      'SOURCE_CONTEXT_DIR': '',
      'DOCKER_FILE_PATH': 'docker/angular-build/Dockerfile',
      'CPU_LIMIT': '1',
      'MEMORY_LIMIT': '4Gi',
      'CPU_REQUEST': '250m',
      'MEMORY_REQUEST': '2Gi'
    }
  }));

  // final angular on caddy
  objects.push(...oc.processDeploymentTemplate(`${templatesLocalBaseUrl}/templates/greenlight/greenlight-build.json`, {
    'param': {
      'NAME': phases[phase].name + phases[phase].suffix,
      'SOURCE_IMAGE_NAMESPACE': '',
      'SOURCE_IMAGE_NAME': 'greenlight-angular',
      'SOURCE_IMAGE_TAG': 'latest',
      'RUNTIME_IMAGE_NAMESPACE': 'devex-bcgov-dap-tools',
      'RUNTIME_IMAGE_NAME': 'caddy-runtime',
      'RUNTIME_IMAGE_TAG': 'latest',
      'OUTPUT_IMAGE_TAG': 'latest'
      // 'SUFFIX': phases[phase].suffix,
      // 'VERSION': phases[phase].tag,
      // 'SOURCE_REPOSITORY_URL': oc.git.http_url,
      // 'SOURCE_REPOSITORY_REF': oc.git.ref
    }
  }));

  oc.applyRecommendedLabels(objects, phases[phase].name, phase, phases[phase].changeId, phases[phase].instance)
  oc.applyAndBuild(objects)
}
