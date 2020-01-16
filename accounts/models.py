from django.db import models  # type: ignore


from django.conf import settings
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser
from django.db.models.signals import post_save
from django.dispatch import receiver

# from phonenumber_field.modelfields import PhoneNumberField
# from imagekit.models import ImageSpecField
# from imagekit.processors import ResizeToFill


class UserManager(BaseUserManager):
    def create_user(self, email, password=None):
        """
        Creates and saves a User with the given email and password.
        """
        if not email:
            raise ValueError("Users must have an email ")

        # user = self.model(
        #     email=self.normalize_email(email),
        # )

        user = self.model(email=email)

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_staffuser(self, email, password):
        """
        Creates and saves a staff user with the given email and password.
        """
        user = self.create_user(email, password=password)
        user.staff = True
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        """
        Creates and saves a superuser with the given email and password.
        """
        user = self.create_user(email, password=password)
        user.staff = True
        user.admin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):

    first_name = models.CharField(max_length=20, blank=True, null=True)
    last_name = models.CharField(max_length=20, blank=True, null=True)

    email = models.EmailField(
        verbose_name="email address", max_length=255, blank=True, null=True, unique=True
    )

    active = models.BooleanField(default=True)
    staff = models.BooleanField(default=False)  # a admin user; non super-user
    admin = models.BooleanField(default=False)  # a superuser
    # notice the absence of a "Password field", that's built in.

    USERNAME_FIELD: str = "email"
    REQUIRED_FIELDS: list = []  # email & Password are required by default.

    def get_full_name(self) -> str:
        # The user is identified by their email address
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name and not self.last_name:
            return f"{self.first_name}"
        elif self.last_name and not self.first_name:
            return f"{self.last_name}"
        else:
            return str(self.email)

    def get_short_name(self) -> str:
        # The user is identified by their email
        if self.first_name and self.last_name:
            return f"{self.first_name}"
        elif self.first_name and not self.last_name:
            return f"{self.first_name}"
        elif self.last_name and not self.first_name:
            return f"{self.last_name}"
        else:
            return str(self.email)

    def __str__(self) -> str:  # __unicode__ on Python 2
        # NOTE: Never change this as it is used in prompt_for_payment as an input
        return str(self.email)

    def has_perm(self, perm, obj=None) -> bool:
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label) -> bool:
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self) -> bool:
        "Is the user a member of staff?"
        return self.staff

    @property
    def is_admin(self) -> bool:
        "Is the user a admin member?"
        return self.admin

    @property
    def is_active(self) -> bool:
        "Is the user active?"
        return self.active

    objects = UserManager()


def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    print(instance, "instance in groupvideo")
    from datetime import datetime

    new_file_name = f"{datetime.now()}{filename}"
    # the above was done just to make sure that we have a unique name since in PROD, django is generating a unique name on save

    return "images/profile_pics/{0}/{1}".format(instance.user.email, new_file_name)


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)

    profile_pic = models.ImageField(
        upload_to=user_directory_path, blank=True, null=True
    )
    # profile_pic_thumbnail = ImageSpecField(
    #     source="profile_pic",
    #     processors=[ResizeToFill(100, 50)],
    #     format="JPEG",
    #     options={"quality": 60},
    # )

    def __str__(self) -> str:
        return f"{self.user}'s Profile'"

    # def get_user_profile_pic_thumbnail(self):
    #     return self.profile_pic_thumbnail.url


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        print("created for the first time")
        UserProfile.objects.create(user=instance)
    else:
        print("Not first time creation")


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    print("updated!!!")
    print(instance, "instance")
    instance.userprofile.save()


class Aircraft(models.Model):
    "this is the main aircraft description model"
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # users = models.ManyToManyField(User)
    description = models.TextField(blank=True, null=True)

    AIRCRAFT_TYPE = (
        ("GA", "General Aviation"),
        ("LSA", "Light Sport Aircraft"),
        ("LARGE", "LARGE Aircraft"),
        ("MAV", "Miniature UAS"),
        ("SUAS", "Small Uas"),
        ("STUAS", "Small Tactical UAS"),
        ("TUAS", "Tactical UAS"),
        ("MALE", "Medium Altitude Long Endurance UAS"),
        ("HALE", "High Altitude Long Endurance UAS"),
    )
    aircraft_type = models.CharField(max_length=5, choices=AIRCRAFT_TYPE, null=True)
    serial_number = models.CharField(max_length=50, unique=True)

    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):

        super(Aircraft, self).save(*args, **kwargs)

        # TODO: Simplify the logic below and only do it on creation or edit

        if self.aircraft_type == "GA":
            x: str = "KO/GA/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "LSA":
            x: str = "KO/LSA/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "LARGE":
            x: str = "KO/LARGE/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "MAV":
            x: str = "KO/MAV/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "SUAS":
            x: str = "KO/SUAS/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "SUAS":
            x: str = "KO/SUAS/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "STUAS":
            x: str = "KO/STUAS/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "TUAS":
            x: str = "KO/TUAS/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "MALE":
            x: str = "KO/MALE/"
            y: int = self.pk
            self.serial_number = x + str(y)

        elif self.aircraft_type == "HALE":
            x: str = "KO/HALE/"
            y: int = self.pk
            self.serial_number = x + str(y)
        else:
            pass

        super(Aircraft, self).save(*args, **kwargs)

    def __str__(self):
        return self.serial_number
