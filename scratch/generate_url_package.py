import json
from urllib.parse import urlencode, quote

PRIMARY_DOMAIN = "https://resumeiq-red.vercel.app/"
CUSTOM_SHORT_DOMAIN = "https://resumeiq.app"

CAMPAIGNS = [
    {
        "platform": "LinkedIn Post & Profile",
        "utm_source": "linkedin",
        "utm_medium": "social",
        "utm_campaign": "resumeiq_launch",
        "utm_content": "featured_link",
        "short_slug": "resumeiq.app/linkedin"
    },
    {
        "platform": "Twitter / X Post & Bio",
        "utm_source": "twitter",
        "utm_medium": "social",
        "utm_campaign": "resumeiq_launch",
        "utm_content": "card_click",
        "short_slug": "resumeiq.app/x"
    },
    {
        "platform": "WhatsApp Direct Share",
        "utm_source": "whatsapp",
        "utm_medium": "dark_social",
        "utm_campaign": "resumeiq_share",
        "utm_content": "dm_link",
        "short_slug": "resumeiq.app/wa"
    },
    {
        "platform": "Recruiter Email Signature",
        "utm_source": "recruiter_email",
        "utm_medium": "email",
        "utm_campaign": "outreach",
        "utm_content": "email_sig",
        "short_slug": "resumeiq.app/email"
    },
    {
        "platform": "Product Hunt Launch",
        "utm_source": "producthunt",
        "utm_medium": "referral",
        "utm_campaign": "launch",
        "utm_content": "ph_badge",
        "short_slug": "resumeiq.app/ph"
    }
]

def generate_tracked_urls():
    results = []
    for c in CAMPAIGNS:
        params = {
            "utm_source": c["utm_source"],
            "utm_medium": c["utm_medium"],
            "utm_campaign": c["utm_campaign"],
            "utm_content": c["utm_content"]
        }
        full_url = f"{PRIMARY_DOMAIN}?{urlencode(params)}"
        results.append({
            "platform": c["platform"],
            "full_tracked_url": full_url,
            "short_slug": c["short_slug"]
        })
    return results

def get_cache_invalidation_links():
    encoded_url = quote(PRIMARY_DOMAIN, safe="")
    return {
        "linkedin": f"https://www.linkedin.com/post-inspector/inspect/{encoded_url}",
        "facebook": f"https://developers.facebook.com/tools/debug/?q={encoded_url}",
        "twitter": "https://cards-dev.twitter.com/validator"
    }

if __name__ == "__main__":
    print("=== RESUMEIQ SOCIAL SHAREABLE & TRACKED URL PACKAGE ===")
    print(f"\n1. Clean HTTPS Canonical URL:\n   {PRIMARY_DOMAIN}\n")
    print("2. Tracked UTM Share URLs:")
    for item in generate_tracked_urls():
        print(f"   • [{item['platform']}]")
        print(f"     Full Tracked URL : {item['full_tracked_url']}")
        print(f"     Short Domain Mask: https://{item['short_slug']}\n")
    
    print("3. Social Cache Invalidation Direct Links:")
    cache_links = get_cache_invalidation_links()
    print(f"   • LinkedIn Inspector: {cache_links['linkedin']}")
    print(f"   • Facebook Debugger : {cache_links['facebook']}")
    print(f"   • X/Twitter Validator: {cache_links['twitter']}\n")
