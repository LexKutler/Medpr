﻿using MediatR;
using MedprCore;
using MedprCore.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MedprCQS.Commands.Users;

public class DeleteUserCommand: IRequest<int>
{
    public UserDTO User { get; set; }
}
