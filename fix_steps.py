import os
import re

screens = [
    ('PhoneEmailScreen.js', 1),
    ('OTPScreen.js', 2),
    ('PasswordScreen.js', 3),
    ('NameScreen.js', 4),
    ('BirthdayScreen.js', 5),
    ('GenderScreen.js', 6),
    ('InterestedInScreen.js', 7),
    ('DatingIntentScreen.js', 8),
    ('InterestsScreen.js', 9),
    ('BioScreen.js', 10),
    ('PhotoUploadScreen.js', 11),
    ('LocationPermissionScreen.js', 12),
    ('NotificationPermissionScreen.js', 13)
]

base_dir = r'D:\dating app 1\loviq\src\screens\onboarding'

for filename, step in screens:
    filepath = os.path.join(base_dir, filename)
    if not os.path.exists(filepath): continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace currentStep={X}
    content = re.sub(r'currentStep=\{\d+\}', f'currentStep={{{step}}}', content)
    
    # Make sure totalSteps={13} is passed or default in OnboardingHeader
    # Wait, we can just update OnboardingHeader.js to have totalSteps = 13 default!
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Update OnboardingHeader.js default totalSteps
header_path = r'D:\dating app 1\loviq\src\components\OnboardingHeader.js'
with open(header_path, 'r', encoding='utf-8') as f:
    header_content = f.read()

header_content = header_content.replace('totalSteps = 12', 'totalSteps = 13')
with open(header_path, 'w', encoding='utf-8') as f:
    f.write(header_content)

print('Updated all step counters.')
