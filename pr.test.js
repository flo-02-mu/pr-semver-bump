const { extractPRNumber, getReleaseType, getReleaseNotes } = require('./pr');

test('can extract a PR number from a PR merge commit message', () => {
    expect(extractPRNumber('Merge pull request #4 from some/mockBranch')).toEqual('4')
    expect(extractPRNumber('Merge pull request #42 from some/mockBranch')).toEqual('42')
})

test('returns null if no PR number is found in a commit message', () => {
    expect(extractPRNumber('Merge branch master into some/mockBranch')).toEqual(null)
})

test('can get release type', () => {
    const mockPR = {
        labels: [
            { name: 'mock-major-label' },
            { name: 'not-release-related' },
            { name: 'another one' },
        ]
    }
    const releaseLabels = {
        'mock-major-label': 'major',
        'mock-minor-label': 'minor',
        'mock-patch-label': 'patch',
    }
    
    const type = getReleaseType(mockPR, releaseLabels)
    expect(type).toEqual('major')
})

test('throws if no valid release label is present', () => {
    const mockPR = {
        labels: [
            { name: 'some-label' },
            { name: 'not-release-related' },
            { name: 'another one' },
        ]
    }
    const releaseLabels = {
        'mock-major-label': 'major',
        'mock-minor-label': 'minor',
        'mock-patch-label': 'patch',
    }
    
    expect(() => {
        getReleaseType(mockPR, releaseLabels)
    }).toThrow('no release label specified on PR')
})

test('throws if multiple valud release labels are present', () => {
    const mockPR = {
        labels: [
            { name: 'mock-major-label' },
            { name: 'not-release-related' },
            { name: 'mock-patch-label' },
        ]
    }
    const releaseLabels = {
        'mock-major-label': 'major',
        'mock-minor-label': 'minor',
        'mock-patch-label': 'patch',
    }
    
    expect(() => {
        getReleaseType(mockPR, releaseLabels)
    }).toThrow('too many release labels specified on PR')
})

test('can get release notes', async () => {
    const mockPR = {
        body: "this is the body\nbegin notes\nhere are some release notes\nend notes\n"
    }

    const notes = getReleaseNotes(mockPR, new RegExp('begin notes([\\s\\S]*)end notes'), false)
    expect(notes).toEqual('here are some release notes')
})

test('returns empty release notes if not required and not found or empty', async () => {
    const bodies = [
        "",
        "this is the body",
        "this is the body\n-begin notes--end notes-\nmore body\n",
        "this is the body\n-begin notes-\n\n\n-end notes-\nmore body\n",
        "this is the body\n-begin notes-      \n   \n  -end notes-\nmore body\n",
    ]

    bodies.forEach(body => {
        const mockPR = { body: body }
        const notes = getReleaseNotes(mockPR, new RegExp('-begin notes-([\\s\\S]*)-end notes-'), false)
        expect(notes).toBe('')
    })
})

test('throws if release notes required but not found or empty', async () => {
    const bodies = [
        "",
        "this is the body",
        "this is the body\n-begin notes--end notes-\nmore body\n",
        "this is the body\n-begin notes-\n\n\n-end notes-\nmore body\n",
        "this is the body\n-begin notes-      \n   \n  -end notes-\nmore body\n",
    ]

    bodies.forEach(body => {
        const mockPR = { body: body }
        expect(() => {
            getReleaseNotes(mockPR, new RegExp('-begin notes-([\\s\\S]*)-end notes-'), true)
        }).toThrow('missing release notes')
    })
})