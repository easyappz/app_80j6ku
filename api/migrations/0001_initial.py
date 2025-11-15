from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Member",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("name", models.CharField(blank=True, max_length=255)),
                ("password_hash", models.CharField(max_length=512)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
