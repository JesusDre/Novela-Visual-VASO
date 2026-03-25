import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('novela', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='historia',
            name='portada',
            field=models.ForeignKey(blank=True, db_column='id_portada', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='historias_portada', to='novela.imagen'),
        ),
    ]
