﻿using MediatR;
using MedprCore.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MedprCQS.Queries.Appointments;

public class GetAppointmentsByUserIdQuery : IRequest<List<AppointmentDTO>>
{
    public Guid UserId { get; set; }
}