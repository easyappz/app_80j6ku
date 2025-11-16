import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_projects_assets_history"),
    ]

    operations = [
        migrations.CreateModel(
            name="ChunkedUpload",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("filename", models.CharField(max_length=255)),
                ("mime", models.CharField(max_length=100, default="video/mp4")),
                ("total_size", models.IntegerField()),
                ("received_size", models.IntegerField(default=0)),
                ("temp_path", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chunked_uploads",
                        to="api.project",
                    ),
                ),
            ],
        ),
    ]
