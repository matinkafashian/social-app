from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_userprofile_followers_count_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="categories",
            field=models.JSONField(default=list, blank=True),
        ),
    ]



