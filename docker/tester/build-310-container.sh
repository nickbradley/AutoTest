#!/usr/bin/env bash

# ##############################################################################
# build-test-container.sh
# Nick Bradley <nbrad11@cs.ubc.ca>
#
# Description:
# Builds a Docker image for testing a specific deliverable. A specific commit
# (including all dependencies, i.e. node_modules, typings, etc) of the deliverable's
# repository is baked into the image. The repository name and commit form the images's
# tag and version (e.g. autotest/cpsc310d1-priv:77e4bc4). A cloned image is also
# created with version set to latest (e.g. autotest/cpsc310d1-priv:latest) so a
# specific commit does not need to be specified when executing tests.
#
# Parameters:
# $1: A GitHub API key with permission to pull the deliverable repositories.
#
# $2: The name of the deliverable repository on GitHub.
#
# $3: The commit SHA (first 7 characters). This is used to both set the version
#     of the deliverable repository in the Docker image and as its version tag.
#
# $4: The name of the test suite this container should run (e.g. d1, d2, d3, d1p, d2p, d3p).
#     Becomes the TS environment variable for the test suite.
#
# $5+: List of external servers that should be accesible inside the test container.
#      Each server address should include the scheme (default is http) and the port (default is 80).
#
# Example:
#  ./build-test-container.sh af345rt3tt14636d1779g0452c47g25cd4ad75bce testsuite d3c6e11 d1 "skaha.cs.ubc.ca:8525" "http://www.google.com"
# ##############################################################################

set -o errexit  # exit on command failure
set -o pipefail # exit if any command in pipeline fails
set -o nounset  # exit if undeclared variable is used

dockerDir=$(dirname $BASH_SOURCE)

githubKey=${1}
repoName=${2}
commit=${3}
deliverable=${4}

if [[ ! -z "${@:5}" ]]
then
  allowDNS=1
  externalServers="${@:5}"
else
  allowDNS=0
  externalServers=""
fi

git clone https://${GITHUB_KEY}@github.ubc.ca/cpsc310/cpsc310container.git
cd ./cpsc310container/

docker build -f Dockerfile-310 -t autotest/cpsc310__bootstrap:master .

## Tag based on Deliverables that exist for each course to run when markByBatch flag is true.
docker tag $(docker images -q autotest/cpsc310__bootstrap:master) autotest/cpsc310__bootstrap:latest



