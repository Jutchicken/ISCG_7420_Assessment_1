import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('HospitalSystem', '0003_alter_appointment_appointment_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='doctor',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='doctor_appointments',
                to='auth.user',
            ),
        ),
        migrations.AddField(
            model_name='appointment',
            name='patient',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='patient_appointments',
                to='auth.user',
            ),
        ),
    ]