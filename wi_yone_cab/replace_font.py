#!/usr/bin/env python3
import os

filepath = os.path.join('app', '(tabs)', 'index.tsx')

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fontFamily: "Quicksand"', 'fontFamily: "System"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Updated all fontFamily Quicksand to System in home screen")
