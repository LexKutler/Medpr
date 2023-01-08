﻿using MediatR;
using MedprCore.DTO;

namespace MedprCQS.Commands.Families;

public class DeleteFamilyCommand : IRequest<int>
{
    public FamilyDTO Family { get; set; }
}