from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_postsave"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="post",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name="notifications", to="accounts.post"),
        ),
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(choices=[("like", "like"), ("comment", "comment"), ("follow", "follow")], max_length=16),
        ),
    ]










