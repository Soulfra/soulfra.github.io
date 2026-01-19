#!/usr/bin/env python3
"""
Deployment Testing & Validation Script

Tests deployed sites, checks DNS, validates SSL, and reports status.
Run this after deploying to verify everything works.

Usage:
    ./test-deployment.py <url>
    ./test-deployment.py deathtodata.com
    ./test-deployment.py https://myapi.com

Features:
- DNS resolution check
- SSL certificate validation
- HTTP/HTTPS redirects
- Response time measurement
- Status code validation
- Content verification
- SEO checks (basic)
"""

import sys
import socket
import ssl
import requests
from urllib.parse import urlparse
from datetime import datetime
import subprocess
import json

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.END}")

def normalize_url(url):
    """Ensure URL has a scheme"""
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'
    return url

def test_dns_resolution(domain):
    """Test if domain resolves to an IP"""
    print_header("DNS Resolution Test")

    try:
        # Remove scheme and path, get just domain
        parsed = urlparse(normalize_url(domain))
        hostname = parsed.netloc or parsed.path.split('/')[0]

        # Resolve domain
        ip_address = socket.gethostbyname(hostname)
        print_success(f"Domain resolves to: {ip_address}")

        # Check if it's GitHub Pages IP
        github_ips = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153']
        if ip_address in github_ips:
            print_info("Detected GitHub Pages hosting")

        return True, ip_address
    except socket.gaierror as e:
        print_error(f"DNS resolution failed: {e}")
        print_warning("Make sure DNS records are configured correctly")
        return False, None

def test_ssl_certificate(url):
    """Check SSL certificate validity"""
    print_header("SSL Certificate Test")

    parsed = urlparse(normalize_url(url))
    hostname = parsed.netloc or parsed.path.split('/')[0]

    try:
        # Create SSL context
        context = ssl.create_default_context()

        # Connect and get certificate
        with socket.create_connection((hostname, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

                # Check expiration
                not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                days_remaining = (not_after - datetime.now()).days

                print_success(f"SSL certificate is valid")
                print_info(f"Issued to: {cert['subject'][0][0][1]}")
                print_info(f"Issued by: {cert['issuer'][1][0][1]}")
                print_info(f"Expires: {not_after.strftime('%Y-%m-%d')} ({days_remaining} days remaining)")

                if days_remaining < 30:
                    print_warning(f"Certificate expires soon! ({days_remaining} days)")

                return True
    except ssl.SSLError as e:
        print_error(f"SSL certificate error: {e}")
        return False
    except Exception as e:
        print_error(f"Could not verify SSL: {e}")
        return False

def test_http_response(url):
    """Test HTTP response and redirects"""
    print_header("HTTP Response Test")

    url = normalize_url(url)

    try:
        # Test HTTPS
        start_time = datetime.now()
        response = requests.get(url, timeout=10, allow_redirects=True)
        response_time = (datetime.now() - start_time).total_seconds()

        print_success(f"Status Code: {response.status_code}")
        print_info(f"Response Time: {response_time:.2f}s")

        # Check redirects
        if response.history:
            print_info(f"Redirects: {len(response.history)}")
            for i, resp in enumerate(response.history, 1):
                print_info(f"  {i}. {resp.status_code} → {resp.url}")

        # Check final URL
        if response.url != url:
            print_info(f"Final URL: {response.url}")

        # Response headers
        print_info(f"Content-Type: {response.headers.get('Content-Type', 'Not specified')}")
        print_info(f"Server: {response.headers.get('Server', 'Not specified')}")

        # Check for common issues
        if response.status_code != 200:
            print_warning(f"Status code is {response.status_code}, expected 200")

        if response_time > 3:
            print_warning(f"Slow response time: {response_time:.2f}s")

        return True, response
    except requests.exceptions.SSLError as e:
        print_error(f"SSL error: {e}")
        return False, None
    except requests.exceptions.ConnectionError as e:
        print_error(f"Connection error: {e}")
        return False, None
    except requests.exceptions.Timeout:
        print_error("Request timed out after 10 seconds")
        return False, None
    except Exception as e:
        print_error(f"Request failed: {e}")
        return False, None

def test_http_to_https_redirect(url):
    """Check if HTTP redirects to HTTPS"""
    print_header("HTTP → HTTPS Redirect Test")

    parsed = urlparse(normalize_url(url))
    http_url = f"http://{parsed.netloc or parsed.path}"

    try:
        response = requests.get(http_url, timeout=10, allow_redirects=False)

        if response.status_code in [301, 302, 303, 307, 308]:
            location = response.headers.get('Location', '')
            if location.startswith('https://'):
                print_success("HTTP properly redirects to HTTPS")
                return True
            else:
                print_warning(f"HTTP redirects but not to HTTPS: {location}")
                return False
        else:
            print_warning("No HTTP to HTTPS redirect configured")
            print_info("Consider enforcing HTTPS for better security")
            return False
    except Exception as e:
        print_error(f"Could not test redirect: {e}")
        return False

def test_content(response):
    """Basic content validation"""
    print_header("Content Validation")

    if not response:
        print_error("No response to validate")
        return False

    try:
        content = response.text
        content_length = len(content)

        print_success(f"Content Length: {content_length:,} bytes")

        # Check for common elements
        has_doctype = '<!DOCTYPE' in content or '<!doctype' in content
        has_html = '<html' in content.lower()
        has_head = '<head' in content.lower()
        has_body = '<body' in content.lower()
        has_title = '<title>' in content.lower()

        if has_doctype:
            print_success("DOCTYPE declaration found")
        else:
            print_warning("No DOCTYPE declaration")

        if has_html and has_head and has_body:
            print_success("Valid HTML structure detected")
        else:
            print_warning("HTML structure may be incomplete")

        if has_title:
            # Extract title
            import re
            title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
            if title_match:
                print_info(f"Page Title: {title_match.group(1)}")
        else:
            print_warning("No <title> tag found (bad for SEO)")

        # Check for meta tags (SEO)
        has_description = 'name="description"' in content or "name='description'" in content
        has_viewport = 'name="viewport"' in content or "name='viewport'" in content

        if has_description:
            print_success("Meta description found (good for SEO)")
        else:
            print_warning("No meta description (bad for SEO)")

        if has_viewport:
            print_success("Viewport meta tag found (mobile-friendly)")
        else:
            print_warning("No viewport meta tag (not mobile-optimized)")

        return True
    except Exception as e:
        print_error(f"Content validation failed: {e}")
        return False

def test_performance(url):
    """Basic performance metrics"""
    print_header("Performance Test")

    url = normalize_url(url)

    try:
        # Multiple requests to get average
        times = []
        for i in range(3):
            start = datetime.now()
            response = requests.get(url, timeout=10)
            elapsed = (datetime.now() - start).total_seconds()
            times.append(elapsed)

        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)

        print_info(f"Average Response Time: {avg_time:.2f}s")
        print_info(f"Min: {min_time:.2f}s | Max: {max_time:.2f}s")

        if avg_time < 1:
            print_success("Excellent response time!")
        elif avg_time < 3:
            print_success("Good response time")
        else:
            print_warning("Slow response time - consider optimization")

        # Check response size
        content_length = int(response.headers.get('Content-Length', len(response.content)))
        print_info(f"Content Size: {content_length:,} bytes ({content_length/1024:.1f} KB)")

        return True
    except Exception as e:
        print_error(f"Performance test failed: {e}")
        return False

def run_dig_command(domain):
    """Run dig command to show DNS details"""
    print_header("DNS Details (dig)")

    parsed = urlparse(normalize_url(domain))
    hostname = parsed.netloc or parsed.path.split('/')[0]

    try:
        result = subprocess.run(['dig', '+short', hostname],
                              capture_output=True, text=True, timeout=10)

        if result.returncode == 0 and result.stdout.strip():
            print_info("DNS A Records:")
            for line in result.stdout.strip().split('\n'):
                print(f"  → {line}")
            return True
        else:
            print_warning("Could not retrieve DNS records")
            return False
    except FileNotFoundError:
        print_info("dig command not available (install with: brew install bind)")
        return False
    except Exception as e:
        print_error(f"dig command failed: {e}")
        return False

def generate_report(results):
    """Generate summary report"""
    print_header("Test Summary")

    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    failed_tests = total_tests - passed_tests

    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

    print(f"Total Tests: {total_tests}")
    print_success(f"Passed: {passed_tests}")
    if failed_tests > 0:
        print_error(f"Failed: {failed_tests}")

    print(f"\nSuccess Rate: {success_rate:.1f}%")

    if success_rate == 100:
        print_success("\n🎉 All tests passed! Your deployment looks great!")
    elif success_rate >= 80:
        print_warning("\n✅ Most tests passed. Review warnings above.")
    elif success_rate >= 50:
        print_warning("\n⚠️  Some tests failed. Check errors above.")
    else:
        print_error("\n❌ Multiple failures detected. Review deployment.")

    # Failed tests detail
    if failed_tests > 0:
        print(f"\n{Colors.BOLD}Failed Tests:{Colors.END}")
        for test_name, result in results.items():
            if not result:
                print_error(f"  • {test_name}")

def main():
    if len(sys.argv) < 2:
        print(f"{Colors.BOLD}Usage:{Colors.END}")
        print(f"  {sys.argv[0]} <url>")
        print(f"\n{Colors.BOLD}Examples:{Colors.END}")
        print(f"  {sys.argv[0]} deathtodata.com")
        print(f"  {sys.argv[0]} https://myapi.com")
        sys.exit(1)

    url = sys.argv[1]

    print(f"\n{Colors.BOLD}{Colors.GREEN}Deployment Testing Suite{Colors.END}")
    print(f"{Colors.BOLD}Target:{Colors.END} {url}")
    print(f"{Colors.BOLD}Started:{Colors.END} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    results = {}

    # Run tests
    results['DNS Resolution'], ip = test_dns_resolution(url)

    if results['DNS Resolution']:
        results['SSL Certificate'] = test_ssl_certificate(url)
        results['HTTP Response'], response = test_http_response(url)
        results['HTTPS Redirect'] = test_http_to_https_redirect(url)

        if results['HTTP Response']:
            results['Content Validation'] = test_content(response)
            results['Performance'] = test_performance(url)

        run_dig_command(url)
    else:
        print_error("\nDNS resolution failed. Skipping remaining tests.")
        print_warning("Fix DNS configuration and try again.")

    # Generate report
    generate_report(results)

    print(f"\n{Colors.BOLD}Completed:{Colors.END} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Exit code based on results
    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()
