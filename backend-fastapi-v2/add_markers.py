# add_markers.py
import os
import re

# Patterns to match
unit_patterns = [
    'test_services.py',
    'test_repositories.py',
    'test_dependencies.py',
    'test_audit_repositories.py',
    'test_security.py',
    'test_rate_limiter.py',
    'test_auth_rate_limit.py',
]

integration_patterns = [
    'test_routers.py',
]

def add_marker_to_file(filepath, marker):
    """Add pytest marker to all async test functions in a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to find @pytest.mark.asyncio
    pattern = r'(@pytest\.mark\.asyncio)'

    # Replace with marker + asyncio
    replacement = f'@pytest.mark.{marker}\n@pytest.mark.asyncio'

    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Added {marker} marker to {filepath}")
    else:
        print(f"⏭️ No changes needed for {filepath}")

# Process unit tests
for root, dirs, files in os.walk('tests/unit'):
    for file in files:
        if file.endswith('.py') and any(p in file for p in unit_patterns):
            filepath = os.path.join(root, file)
            add_marker_to_file(filepath, 'unit')

# Process integration tests
for root, dirs, files in os.walk('tests/integration'):
    for file in files:
        if file.endswith('.py') and any(p in file for p in integration_patterns):
            filepath = os.path.join(root, file)
            add_marker_to_file(filepath, 'integration_fast')

print("\n✅ Done! Run pytest with markers now.")
