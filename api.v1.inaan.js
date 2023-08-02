const http = require('http');

const server = http.createServer((req, res) => {

    const qstring = req.url.substring(req.url.indexOf('?')).toLowerCase();
    const noqstring = req.url.split('?')[0];
    const relpath = noqstring.replace('/', '');

    const re = RegExp('ark:/*([^/]+)/');
    const upathparts = relpath.split(re);
    const upathstr = upathparts.join(', ');
    const NAAN = upathparts[1];
    const Name = upathparts[2] || '<ark:NAAN/term expected in URL path part>';
    const humanName = decodeURIComponent(Name);

    var response = '';

    if (qstring == '?' || qstring == '??' || qstring == '?info') {
        response = `who: ${humanName}
what: (:unkn) unknown definition
when: (:unkn) unknown creation date
where: https://n2t.net/ark:${NAAN}/${Name}
how: (:mtype term) concept literal
persistence: identifier-object binding unbreakable, no known object repository
about: |
 You have accessed an "inline" object (one contained in its own identifier).
 This object is identified by the ARK (Archival Resource Key),
 
     ark:${NAAN}/${Name}
 
 It belongs to a class of ARKs of the form, ark:${NAAN}/<Name>, reserved for
 inline (or in-link) identifiers. All ARKs in this class share the benefits
 and limitations detailed below.
 
 1. This is also a conceptual or abstract object. It consists of neither more
 nor less than what its creator meant to suggest in choosing the linguistic
 and symbolic constructs that make up the <Name> string,
 
     ${Name}
 
 at the end of the identifier.
 
 2. That <Name> string is free-form text except for the usual ARK reserved
 characters: '/' for containment, '.' for variants, and '-' being identity
 inert. Percent-encoding can be used to avoid reserved character syntax.
 For more information on ARKs, see arks.org.
 
 3. The meaning of this concept may be highly subjective. Longer strings may
 convey more meaning or precision than shorter strings. No syntax, language
 choice, or namespace scoping is assumed. As with most free-form linguistic
 and symbolic constructs, there may be ambiguity.
 
 4. Anyone can invent this kind of identifier. No registration is required and
 someone else can use and intend the same identifier string in their own way.
 A more unique and precise way to identify concepts with ARKs, is to register
 (for free) terms, definitions, and examples at the YAMZ.net open vocabulary.
 
 5. The identifier becomes an actionable URL by prepending the ARK resolver,
 
     https://n2t.net/ark:${NAAN}/${Name}
 
 The text you are reading is found by appending the ARK inflection, '?info',
 
     https://n2t.net/ark:${NAAN}/${Name}?info
 
 Resolution of either form produces a YAML document.
 
 6. This type of inline content ARK identifier has features in common with the
 "tag:" and "data:" URI schemes. As with "tag:", it carries an undefined string
 payload, but without any explicit authority. As with "data:", it resolves to
 inline content, but as a YAML document rather than arbitrary (insecure) data.
 
 7. As identifiers, these inline content links are extremely persistent. By
 definition, the content never becomes separated from its identifier. Moreover,
 such an ARK, representing a simple form of content-based addressing, can be
 derived (trivially) from the content, and so it cannot be re-assigned without
 itself changing. Conversely, the content can be derived manually from the ARK
 without the aid of a functioning resolver.
 
 Rationale
 ---------
 Self-contained, conceptual, inline URLs have been used for decades, often as
 non-actionable URNs and URLs (returning 404 Not Found errors). In these cases,
 the meanings are not explicit and the non-actionable links yield no further
 information. Their convenience and low cost, however, are still considerable
 advantages -- no fees, no registration, no storage, no concept server, and no
 configuration. Thus inline URLs will likely continue to be used despite their
 limitations.
 
 To bring more coherence to inline URLs, a class of ARK (Archival Resource Key)
 was created for inline concepts. In particular, ARKs of the form,
 
     https://n2t.net/ark:${NAAN}/<Name>
 
 can be created by anyone, without registration, storage, configuration, local
 resolver, server, or fees. They all resolve to information that explains their
 limitations. Inline ARK bindings are extremely persistent.

`;
    }
    else {
        response = `concept: ${humanName}
more: https://n2t.net/ark:${NAAN}/${Name}?info
`;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(response);
});

const port = 3028;

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

