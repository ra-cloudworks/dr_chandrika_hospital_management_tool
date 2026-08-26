# Install dependencies
pip install django djangorestframework django-cors-headers

# Create django project
django-admin startproject config .

# Migrate
python manage.py migrate

# Activate it:
venv\Scripts\activate        # Windows
.\venv\Scripts\Activate.ps1
source venv/bin/activate     # macOS/Linux

# Runserver
python manage.py runserver

# Activation + Runserver (Using taskipy)
# Task should be defined in pyproject.toml
task dev