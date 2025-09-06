from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_post_categories"),
    ]

    operations = [
        migrations.CreateModel(
            name="PostSave",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, to="auth.user")),
                ("post", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="saves", to="accounts.post")),
            ],
            options={
                "unique_together": {("user", "post")},
            },
        ),
    ]










