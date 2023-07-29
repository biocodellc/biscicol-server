const http = require('http');

const server = http.createServer((req, res) => {

    const qstring = req.url.substring(req.url.indexOf('?')).toLowerCase();
    const noqstring = req.url.split('?')[0];
    const relpath = noqstring.replace('/', '');

    const re = RegExp('ark:/*([^/]+)/');
    const upathparts = relpath.split(re);
    const upathstr = upathparts.join(', ');
    const NAAN = upathparts[1];
    const Name = upathparts[2];

    // xxx hex-decode before presenting? so, eg, definitions could be included

    const info = `about: |
You have accessed an inline object (one contained in its own identifier),

    ark:${NAAN}/${Name}.

As explained below, it is significantly limited in its use and application.
All ARK identifiers of the form, ark:${NAAN}/<Name>, share these limitations.

This object is conceptual or abstract, and consists of neither more nor less
than what its creator meant to suggest by choosing to use the <Name> part,

    ${Name}

at the end of the identifier. The meaning may therefore be highly subjective.

Anyone can create this kind of identifier by simply using a <Name> of their
choice. No registration of any kind is required and no authoritative meaning
exists. Someone else can use and intend the same identifier string in their
own way, so it is not associated with any given definition. On the other hand,
inline (or in-link) content is a form of content based addressing because the
identifier is derived (trivially) from the content, therefore this identifier
cannot be re-assigned without itself changing.

The identifier becomes an actionable URL by using it with the ARK resolver,

    https://n2t.net/ark:${NAAN}/${Name}

The text you are reading is found by appending the ARK inflection, '?info',

    https://n2t.net/ark:${NAAN}/${Name}?info

Self-contained, conceptual, inline URLs have been used for decades, often as
non-actionable URNs and URLs (returning 404 Not Found errors). Their meanings
were not explicit. The non-actionable links yielded no further information.
But their convenience and low cost, however, are still considerable advantages
-- no fees, no registration, no storage, no concept server, no configuration.
Thus inline URLs will likely continue to be used despite their limitations.

To bring them more coherence, a class of ARK (Archival Resource Key, arks.org)
was created for inline (in-link) concepts. In particular, ARKs of the form,

    https://n2t.net/ark:${NAAN}/<Name>

can be created by anyone, without registration, storage, configuration, server,
or fees, and they all resolve to information that explains their limitations.
Persistence of inline content does not depend on an object repository, but
more on multiple copies of the link itself. It is still recommended, where
feasible, to link your concepts to more explicit definitions, such as those
that can be (freely) created at a vocabulary repository such as YAMZ.net.
`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    var response = `concept: ${Name}
`;

    if (qstring == '?' || qstring == '??' || qstring == '?info') {
        response += 
`who: (:unkn) Unknown
what: ${Name}
when: (:unkn) Unknown
where: https://n2t.net/ark:${NAAN}/${Name}
naa_policy: not unique, meaning may change
persistence: XXX
`;
        response += info;
    }
    else {
        response +=
`more: https://n2t.net/ark:${NAAN}/${Name}?info
`;
    }
    res.end(response);
});

const port = 3028;

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

// const server = http.createServer((req, res) => {
//   const urlParts = req.url.split('/');
//   const lastSegment = urlParts[urlParts.length - 1];
// 
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end(`Concept: ${lastSegment}`);
// });
