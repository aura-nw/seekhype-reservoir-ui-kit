const fs = require('fs')
const path = require('path')
const { gitlogPromise } = require('gitlog')
const gitlog = require('git-log-nodejs')

let package = process.argv.find((arg) => arg.includes('package='))
if (package) {
  package = package.replace('package=', '')
}

const repo = path.join(__dirname, '..', 'packages', package)
const options = {
  repo: repo,
  number: -1000000000000000000000000,
  execOptions: { maxBuffer: 1000 * 1024 },
  fields: ['subject', 'hash', 'abbrevHash', 'authorDate'],
  file: repo,
}

fs.readFile(repo + '/CHANGELOG.md', 'utf8', async (err, data) => {
  if (err) {
    return console.log(err)
  }
  let latestCommitHashIndex
  if (package === 'ui') {
    latestCommitHashIndex =
      data.indexOf(
        '-UI](https://github.com/reservoirprotocol/reservoir-kit/commit/'
      ) + 63
  } else if (package === 'sdk') {
    latestCommitHashIndex =
      data.indexOf(
        '-SDK](https://github.com/reservoirprotocol/reservoir-kit/commit/'
      ) + 64
  }
  const latestCommitHash = data.slice(
    latestCommitHashIndex,
    latestCommitHashIndex + 40
  )

  const tags = await gitlog.tags()

  gitlogPromise(options)
    .then((commits) => {
      let latestCommitIndex
      for (let i = 0; i < commits.length; i++) {
        if (commits[i].hash === latestCommitHash) {
          latestCommitIndex = i
          break
        } else {
          continue
        }
      }

      const newCommits = commits.slice(0, latestCommitIndex)

      const changelog = newCommits.reduce((changelog, commit) => {
        if (
          !commit.subject ||
          commit.subject.includes('changelog:') ||
          commit.subject.includes('chore:') ||
          commit.subject.includes('wip:') ||
          commit.subject.includes("Merge branch 'main' into")
        ) {
          return changelog
        }

        let version = null
        const commitLink = `https://github.com/reservoirprotocol/reservoir-kit/commit/${commit.hash}`

        if (package === 'ui') {
          const i = tags.findIndex((tag) => tag.hash === commit.hash)
          if (i > -1) {
            version = tags[i].name
          }
        } else if (package === 'sdk') {
          const i = tags.findIndex((tag) => tag.hash === commit.hash)
          if (i > -1) {
            version = tags[i].name
          }
        }

        if (version !== null) {
          changelog += `\n## [${version}](${commitLink}) (${
            commit.authorDate.split(' ')[0]
          })\n`
        } else {
          changelog += `\n* ${commit.subject} [${commit.abbrevHash}](${commitLink})`
        }

        return `${changelog}`
      }, '')

      const oldChangelog = data.slice(data.indexOf('##'))

      const newChangelog = changelog + '\n' + oldChangelog

      fs.writeFile(repo + '/CHANGELOG.md', newChangelog, function (err) {
        if (err) {
          return console.log(err)
        }
        console.log(
          '\x1b[32m%s\x1b[0m',
          `Changelog was generated from ${commits.length} commits`
        )
      })
    })
    .catch((err) => console.log('\x1b[31m%s\x1b[0m', err))
})
