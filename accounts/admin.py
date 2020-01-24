from django.contrib import admin  # type: ignore

from accounts.models import User, UserProfile

admin.site.register(User)
admin.site.register(UserProfile)
