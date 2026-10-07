import re

def optimize_seo():
    path = r'c:\Users\USER\Documents\MY JOB AUTOMATION\portfolio\index.html'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Update Title
    html = re.sub(
        r'<title>.*?</title>',
        '<title>Christopher G. Canapi Jr. | GitHub Portfolio - Full-Stack &amp; Automation Developer</title>',
        html
    )

    # Update Description
    html = re.sub(
        r'<meta name="description" content=".*?">',
        '<meta name="description" content="Christopher G. Canapi Jr.\'s GitHub Portfolio. Explore full-stack web applications, practical automation, APIs, and open-source projects hosted on GitHub.">',
        html
    )

    # Add Keywords (if doesn't exist, insert after description)
    if '<meta name="keywords"' not in html:
        html = re.sub(
            r'(<meta name="description" content=".*?">)',
            r'\1\n<meta name="keywords" content="Portfolio GitHub, GitHub Portfolio, Christopher G. Canapi Jr., Full-Stack Developer, Automation Developer, Web Developer, Software Engineer Portfolio, GitHub">',
            html
        )

    # Update OG Title and Description
    html = re.sub(
        r'<meta property="og:title" content=".*?">',
        '<meta property="og:title" content="Christopher G. Canapi Jr. | GitHub Portfolio - Full-Stack &amp; Automation Developer">',
        html
    )
    html = re.sub(
        r'<meta property="og:description" content=".*?">',
        '<meta property="og:description" content="Christopher G. Canapi Jr.\'s GitHub Portfolio. Explore full-stack web applications, practical automation, APIs, and open-source projects hosted on GitHub.">',
        html
    )
    
    # Add JSON-LD if not present
    if 'application/ld+json' not in html:
        json_ld = """
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Christopher G. Canapi Jr.",
  "url": "https://christophergcanapijr-png.github.io/portfolio/",
  "jobTitle": "Full-Stack Developer",
  "description": "Full-stack and automation developer building web applications, APIs, and practical business tools.",
  "sameAs": [
    "https://github.com/christophergcanapijr-png",
    "mailto:christophergcanapijr@gmail.com"
  ],
  "worksFor": {
    "@type": "Organization",
    "name": "Freelance"
  }
}
</script>
</head>"""
        html = html.replace('</head>', json_ld)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    optimize_seo()
