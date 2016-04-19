import * as test from "tape"
import * as _ from "ramda"
import * as sinon from "sinon"

import { Auth0 } from "./auth0"

const AUTH0_URL = "https://cluda.auth0.com"
const AUTH0_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJLbW8xMFFHcENPeEtIRFg2VEhKQzJzWmJlWEpYMktDbiIsInNjb3BlcyI6eyJ1c2Vyc19hcHBfbWV0YWRhdGEiOnsiYWN0aW9ucyI6WyJ1cGRhdGUiXX0sInVzZXJzIjp7ImFjdGlvbnMiOlsicmVhZCJdfX0sImlhdCI6MTQ1NDUxODQ4NywianRpIjoiMWMxZTkxNjA3ODY3ZTEyYTEwZmQ2OTVjZTYxZWYwNDgifQ.xwh6dCyidm-nxd2Q6YAZcW7K-xQvLIlZQoIHkxSOGb4"

test("Auth0_", (ot) => {
  ot.plan(4)

  ot.test("- should be able to getUserInfo", (t) => {
    t.plan(2)
    Auth0.getUserInfo(AUTH0_URL, AUTH0_JWT, "auth0|56b765f0ec9cf8243c81da36", "email,app_metadata")
      .then(res => {
        t.equal(res.email, "sogasg@gmail.com", "should return the users email")
        t.equal(_.has("app_metadata", res), true, "should return app_metadata")
      })
  })

  ot.test("- should be able to checkUserAppMetadataUptodate", (t) => {
    t.plan(2)
    Auth0.getUserInfo(AUTH0_URL, AUTH0_JWT, "auth0|56b765f0ec9cf8243c81da36", "email,app_metadata")
      .then(res => {
        const user = { "user_id": "auth0|56b765f0ec9cf8243c81da36", "app_metadata": res.app_metadata }
        Auth0.checkUserAppMetadataUptodate(AUTH0_URL, AUTH0_JWT, user.user_id, user.app_metadata)
          .then(upToDate => t.equal(upToDate, true, "this user should have up to date app_metadata"))

        const outdatedUser = { "user_id": "auth0|56b765f0ec9cf8243c81da36", "app_metadata": {} }
        Auth0.checkUserAppMetadataUptodate(AUTH0_URL, AUTH0_JWT, outdatedUser.user_id, outdatedUser.app_metadata)
          .then(upToDate => t.equal(upToDate, false, "this user should NOT have up to date app_metadata"))
      })
  })

  ot.test("- should be able to addStreamToAuth0UserReturnAppData", (t) => {
    t.plan(1)
    const streamId = "test-stream-" + new Date().getTime()
    Auth0.addStreamToAuth0UserReturnAppData(AUTH0_URL, AUTH0_JWT, "auth0|56b23020f971b162055640c3",
      streamId)
      .then(newAppMetaData => {
        t.equal(JSON.stringify(newAppMetaData).indexOf(streamId) > -1, true,
          "the new app_metadata should contain the new streamId")
      })
  })

  ot.test("- should be able to get the emails of new users (getNewUsersExcept)", (t) => {
    t.plan(1)
    Auth0.getNewUserEmailsExcept(AUTH0_URL, AUTH0_JWT, 20)
      .then(newEmails => {
        t.equal(newEmails.length > 101, true,
          "should return more then 101 new emails")
        console.log("newEmails: " + JSON.stringify(newEmails))

      })
  })
})